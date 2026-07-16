
-- ============================================================
-- Delivery Settings (singleton) + per-product overrides
-- ============================================================

CREATE TABLE IF NOT EXISTS public.delivery_settings (
  id text PRIMARY KEY DEFAULT 'global',
  default_charge numeric(10,2) NOT NULL DEFAULT 120,
  free_over_threshold numeric(10,2) NOT NULL DEFAULT 5000,
  is_free_globally boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT delivery_settings_singleton CHECK (id = 'global')
);

GRANT SELECT ON public.delivery_settings TO authenticated;
GRANT SELECT ON public.delivery_settings TO anon;
GRANT INSERT, UPDATE, DELETE ON public.delivery_settings TO authenticated;
GRANT ALL ON public.delivery_settings TO service_role;

ALTER TABLE public.delivery_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "delivery_settings_read_all" ON public.delivery_settings
  FOR SELECT USING (true);

CREATE POLICY "delivery_settings_admin_write" ON public.delivery_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed the singleton row.
INSERT INTO public.delivery_settings (id) VALUES ('global')
ON CONFLICT (id) DO NOTHING;

CREATE TRIGGER trg_delivery_settings_updated_at
  BEFORE UPDATE ON public.delivery_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE IF NOT EXISTS public.product_delivery_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,
  charge numeric(10,2) NOT NULL DEFAULT 0,
  is_free boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.product_delivery_charges TO authenticated;
GRANT SELECT ON public.product_delivery_charges TO anon;
GRANT INSERT, UPDATE, DELETE ON public.product_delivery_charges TO authenticated;
GRANT ALL ON public.product_delivery_charges TO service_role;

ALTER TABLE public.product_delivery_charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_delivery_charges_read_all" ON public.product_delivery_charges
  FOR SELECT USING (true);

CREATE POLICY "product_delivery_charges_admin_write" ON public.product_delivery_charges
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_product_delivery_charges_updated_at
  BEFORE UPDATE ON public.product_delivery_charges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- Shipping computation helper (used by checkout preview + place_order)
-- Returns the total shipping for an order given the cart items and subtotal.
-- Rule:
--   * If is_free_globally → 0
--   * Else if subtotal >= free_over_threshold → 0
--   * Else per-item charge = product override (respecting is_free) OR default_charge
--     Order shipping = MAX(per-item charge)
-- ============================================================
CREATE OR REPLACE FUNCTION public.compute_shipping(_items jsonb, _subtotal numeric)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  s public.delivery_settings;
  rec jsonb;
  v_variant public.product_variants;
  pd public.product_delivery_charges;
  item_charge numeric(10,2);
  max_charge numeric(10,2) := 0;
  any_item boolean := false;
BEGIN
  SELECT * INTO s FROM public.delivery_settings WHERE id = 'global' LIMIT 1;
  IF NOT FOUND THEN RETURN 0; END IF;

  IF s.is_free_globally THEN RETURN 0; END IF;
  IF _subtotal IS NOT NULL AND _subtotal >= s.free_over_threshold THEN RETURN 0; END IF;

  IF _items IS NULL OR jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) = 0 THEN
    RETURN s.default_charge;
  END IF;

  FOR rec IN SELECT * FROM jsonb_array_elements(_items) LOOP
    any_item := true;
    item_charge := s.default_charge;
    SELECT * INTO v_variant FROM public.product_variants WHERE id = (rec->>'variant_id')::uuid;
    IF FOUND THEN
      SELECT * INTO pd FROM public.product_delivery_charges WHERE product_id = v_variant.product_id;
      IF FOUND THEN
        IF pd.is_free THEN item_charge := 0;
        ELSE item_charge := pd.charge;
        END IF;
      END IF;
    END IF;
    IF item_charge > max_charge THEN max_charge := item_charge; END IF;
  END LOOP;

  IF NOT any_item THEN RETURN s.default_charge; END IF;
  RETURN max_charge;
END;
$$;

REVOKE ALL ON FUNCTION public.compute_shipping(jsonb, numeric) FROM public;
GRANT EXECUTE ON FUNCTION public.compute_shipping(jsonb, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.compute_shipping(jsonb, numeric) TO anon;


-- ============================================================
-- Update place_order to use compute_shipping instead of hard-coded rule
-- (Keeps coupon support from the previous migration.)
-- ============================================================
DROP FUNCTION IF EXISTS public.place_order(jsonb, jsonb, text, text, text, text, text);

CREATE OR REPLACE FUNCTION public.place_order(
  _address jsonb,
  _items jsonb,
  _payment_method text,
  _txn_id text,
  _payment_phone text,
  _notes text,
  _coupon_code text DEFAULT ''
) RETURNS TABLE(id uuid, order_number text, total numeric, discount numeric, coupon_code text)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  uid uuid := auth.uid();
  new_order public.orders;
  computed_subtotal numeric(10,2) := 0;
  computed_discount numeric(10,2) := 0;
  computed_shipping numeric(10,2) := 0;
  computed_total numeric(10,2) := 0;
  rec jsonb;
  v_variant public.product_variants;
  v_product public.products;
  v_brand public.brands;
  qty int;
  unit numeric(10,2);
  item_count int;
  used_code text := NULL;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000'; END IF;
  IF _items IS NULL OR jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'items required';
  END IF;
  item_count := jsonb_array_length(_items);
  IF item_count > 100 THEN RAISE EXCEPTION 'too many items'; END IF;
  IF _payment_method NOT IN ('cod','bkash','nagad','rocket') THEN RAISE EXCEPTION 'invalid payment method'; END IF;

  FOR rec IN SELECT * FROM jsonb_array_elements(_items) LOOP
    qty := COALESCE((rec->>'quantity')::int, 0);
    IF qty <= 0 OR qty > 50 THEN RAISE EXCEPTION 'invalid quantity'; END IF;
    SELECT * INTO v_variant FROM public.product_variants WHERE public.product_variants.id = (rec->>'variant_id')::uuid;
    IF NOT FOUND THEN RAISE EXCEPTION 'variant not found: %', rec->>'variant_id'; END IF;
    SELECT * INTO v_product FROM public.products WHERE public.products.id = v_variant.product_id;
    IF NOT FOUND OR v_product.is_active = false THEN RAISE EXCEPTION 'product unavailable'; END IF;
    unit := ROUND(v_variant.price * (1 - COALESCE(v_product.discount_percent,0)/100.0), 2);
    computed_subtotal := computed_subtotal + (unit * qty);
  END LOOP;

  IF _coupon_code IS NOT NULL AND length(btrim(_coupon_code)) > 0 THEN
    computed_discount := public.apply_coupon_internal(_coupon_code, computed_subtotal);
    used_code := upper(btrim(_coupon_code));
  END IF;

  computed_shipping := public.compute_shipping(_items, computed_subtotal - computed_discount);
  computed_total := computed_subtotal - computed_discount + computed_shipping;
  IF computed_total < 0 THEN computed_total := 0; END IF;

  INSERT INTO public.orders(user_id, address_snapshot, subtotal, shipping, total, payment_method, txn_id, payment_phone, notes, coupon_code, discount)
  VALUES (uid, _address, computed_subtotal, computed_shipping, computed_total, _payment_method,
          NULLIF(_txn_id, ''), NULLIF(_payment_phone, ''), NULLIF(_notes, ''), used_code, computed_discount)
  RETURNING * INTO new_order;

  FOR rec IN SELECT * FROM jsonb_array_elements(_items) LOOP
    qty := (rec->>'quantity')::int;
    SELECT * INTO v_variant FROM public.product_variants WHERE public.product_variants.id = (rec->>'variant_id')::uuid;
    SELECT * INTO v_product FROM public.products WHERE public.products.id = v_variant.product_id;
    SELECT * INTO v_brand FROM public.brands WHERE public.brands.id = v_product.brand_id;
    unit := ROUND(v_variant.price * (1 - COALESCE(v_product.discount_percent,0)/100.0), 2);
    INSERT INTO public.order_items(order_id, product_id, variant_id, product_name, brand_name, size_ml, unit_price, quantity, image_url)
    VALUES (new_order.id, v_product.id, v_variant.id, v_product.name, COALESCE(v_brand.name, ''), v_variant.size_ml, unit, qty, v_product.image_url);
  END LOOP;

  RETURN QUERY SELECT new_order.id, new_order.order_number, new_order.total, new_order.discount, new_order.coupon_code;
END;
$$;

REVOKE ALL ON FUNCTION public.place_order(jsonb, jsonb, text, text, text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.place_order(jsonb, jsonb, text, text, text, text, text) TO authenticated;

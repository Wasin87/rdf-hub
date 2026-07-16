
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS coupon_code text,
  ADD COLUMN IF NOT EXISTS discount numeric(10,2) NOT NULL DEFAULT 0;

-- Validate a coupon without exposing the coupons table to shoppers.
CREATE OR REPLACE FUNCTION public.validate_coupon(_code text, _subtotal numeric)
RETURNS TABLE(code text, discount_type text, discount_value numeric, discount numeric, min_order numeric)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c public.coupons;
  d numeric := 0;
BEGIN
  IF _code IS NULL OR length(btrim(_code)) = 0 THEN
    RAISE EXCEPTION 'Coupon code is required';
  END IF;
  SELECT * INTO c FROM public.coupons WHERE upper(code) = upper(btrim(_code)) LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid coupon code'; END IF;
  IF NOT c.is_active THEN RAISE EXCEPTION 'Coupon is disabled'; END IF;
  IF c.starts_at IS NOT NULL AND c.starts_at > now() THEN RAISE EXCEPTION 'Coupon is not yet active'; END IF;
  IF c.expires_at IS NOT NULL AND c.expires_at < now() THEN RAISE EXCEPTION 'Coupon has expired'; END IF;
  IF c.usage_limit IS NOT NULL AND c.usage_count >= c.usage_limit THEN RAISE EXCEPTION 'Coupon usage limit reached'; END IF;
  IF _subtotal < c.min_order THEN RAISE EXCEPTION 'Minimum order of % not met for this coupon', c.min_order; END IF;
  IF c.discount_type = 'percent' THEN
    d := round(_subtotal * c.discount_value / 100.0, 2);
  ELSE
    d := c.discount_value;
  END IF;
  IF c.max_discount IS NOT NULL AND d > c.max_discount THEN d := c.max_discount; END IF;
  IF d > _subtotal THEN d := _subtotal; END IF;
  RETURN QUERY SELECT c.code, c.discount_type, c.discount_value, d, c.min_order;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_coupon(text, numeric) FROM public;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric) TO authenticated;

-- Applies a coupon inside place_order and increments its usage_count.
CREATE OR REPLACE FUNCTION public.apply_coupon_internal(_code text, _subtotal numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c public.coupons;
  d numeric := 0;
BEGIN
  IF _code IS NULL OR length(btrim(_code)) = 0 THEN RETURN 0; END IF;
  SELECT * INTO c FROM public.coupons WHERE upper(code) = upper(btrim(_code)) FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid coupon code'; END IF;
  IF NOT c.is_active THEN RAISE EXCEPTION 'Coupon is disabled'; END IF;
  IF c.starts_at IS NOT NULL AND c.starts_at > now() THEN RAISE EXCEPTION 'Coupon is not yet active'; END IF;
  IF c.expires_at IS NOT NULL AND c.expires_at < now() THEN RAISE EXCEPTION 'Coupon has expired'; END IF;
  IF c.usage_limit IS NOT NULL AND c.usage_count >= c.usage_limit THEN RAISE EXCEPTION 'Coupon usage limit reached'; END IF;
  IF _subtotal < c.min_order THEN RAISE EXCEPTION 'Minimum order of % not met for this coupon', c.min_order; END IF;
  IF c.discount_type = 'percent' THEN
    d := round(_subtotal * c.discount_value / 100.0, 2);
  ELSE
    d := c.discount_value;
  END IF;
  IF c.max_discount IS NOT NULL AND d > c.max_discount THEN d := c.max_discount; END IF;
  IF d > _subtotal THEN d := _subtotal; END IF;
  UPDATE public.coupons SET usage_count = usage_count + 1, updated_at = now() WHERE id = c.id;
  RETURN d;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_coupon_internal(text, numeric) FROM public;
-- Only place_order (SECURITY INVOKER) needs to call this; grant to authenticated to allow invocation.
GRANT EXECUTE ON FUNCTION public.apply_coupon_internal(text, numeric) TO authenticated;

-- Drop old signature and recreate with coupon support.
DROP FUNCTION IF EXISTS public.place_order(jsonb, jsonb, text, text, text, text);

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

  computed_shipping := CASE WHEN (computed_subtotal - computed_discount) >= 5000 THEN 0 ELSE 120 END;
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

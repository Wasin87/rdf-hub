
-- ============ REVIEWS MODERATION ============
ALTER TABLE public.reviews ALTER COLUMN is_approved SET DEFAULT false;

CREATE OR REPLACE FUNCTION public.reviews_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean := public.has_role(auth.uid(), 'admin');
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NOT is_admin THEN
      NEW.is_approved := false;
      NEW.is_featured := false;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NOT is_admin THEN
      NEW.is_approved := OLD.is_approved;
      NEW.is_featured := OLD.is_featured;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reviews_guard ON public.reviews;
CREATE TRIGGER trg_reviews_guard
  BEFORE INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.reviews_guard();

-- ============ SERVER-PRICED ORDERS ============
CREATE OR REPLACE FUNCTION public.place_order(
  _address jsonb,
  _items jsonb,           -- [{ variant_id: uuid, quantity: int }, ...]
  _payment_method text,
  _txn_id text,
  _payment_phone text,
  _notes text
) RETURNS TABLE(id uuid, order_number text, total numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  new_order public.orders;
  computed_subtotal numeric(10,2) := 0;
  computed_shipping numeric(10,2) := 0;
  computed_total numeric(10,2) := 0;
  rec jsonb;
  v_variant public.product_variants;
  v_product public.products;
  v_brand public.brands;
  qty int;
  unit numeric(10,2);
  item_count int;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000';
  END IF;

  IF _items IS NULL OR jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'items required';
  END IF;

  item_count := jsonb_array_length(_items);
  IF item_count > 100 THEN
    RAISE EXCEPTION 'too many items';
  END IF;

  IF _payment_method NOT IN ('cod','bkash','nagad','rocket') THEN
    RAISE EXCEPTION 'invalid payment method';
  END IF;

  -- First pass: compute authoritative subtotal
  FOR rec IN SELECT * FROM jsonb_array_elements(_items) LOOP
    qty := COALESCE((rec->>'quantity')::int, 0);
    IF qty <= 0 OR qty > 50 THEN
      RAISE EXCEPTION 'invalid quantity';
    END IF;

    SELECT * INTO v_variant FROM public.product_variants WHERE id = (rec->>'variant_id')::uuid;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'variant not found: %', rec->>'variant_id';
    END IF;

    SELECT * INTO v_product FROM public.products WHERE id = v_variant.product_id;
    IF NOT FOUND OR v_product.is_active = false THEN
      RAISE EXCEPTION 'product unavailable';
    END IF;

    unit := ROUND(v_variant.price * (1 - COALESCE(v_product.discount_percent,0)/100.0), 2);
    computed_subtotal := computed_subtotal + (unit * qty);
  END LOOP;

  computed_shipping := CASE WHEN computed_subtotal >= 5000 THEN 0 ELSE 120 END;
  computed_total := computed_subtotal + computed_shipping;

  -- Insert order
  INSERT INTO public.orders(user_id, address_snapshot, subtotal, shipping, total, payment_method, txn_id, payment_phone, notes)
  VALUES (uid, _address, computed_subtotal, computed_shipping, computed_total, _payment_method,
          NULLIF(_txn_id, ''), NULLIF(_payment_phone, ''), NULLIF(_notes, ''))
  RETURNING * INTO new_order;

  -- Second pass: insert authoritative items
  FOR rec IN SELECT * FROM jsonb_array_elements(_items) LOOP
    qty := (rec->>'quantity')::int;
    SELECT * INTO v_variant FROM public.product_variants WHERE id = (rec->>'variant_id')::uuid;
    SELECT * INTO v_product FROM public.products WHERE id = v_variant.product_id;
    SELECT * INTO v_brand FROM public.brands WHERE id = v_product.brand_id;
    unit := ROUND(v_variant.price * (1 - COALESCE(v_product.discount_percent,0)/100.0), 2);

    INSERT INTO public.order_items(order_id, product_id, variant_id, product_name, brand_name, size_ml, unit_price, quantity, image_url)
    VALUES (new_order.id, v_product.id, v_variant.id, v_product.name, COALESCE(v_brand.name, ''), v_variant.size_ml, unit, qty, v_product.image_url);
  END LOOP;

  RETURN QUERY SELECT new_order.id, new_order.order_number, new_order.total;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.place_order(jsonb, jsonb, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order(jsonb, jsonb, text, text, text, text) TO authenticated;

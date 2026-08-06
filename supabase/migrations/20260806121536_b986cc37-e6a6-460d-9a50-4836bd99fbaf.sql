-- 1) Optional custom text size label on variants
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS size_label text;

-- Carry the label through to order line items
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS size_label text;

-- 2) Hot badge + optional countdown timer on products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_hot boolean NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS hot_until timestamptz;

-- 3) New order numbers use the FA- prefix
ALTER TABLE public.orders
  ALTER COLUMN order_number
  SET DEFAULT ('FA-' || upper(substring(replace(gen_random_uuid()::text,'-',''),1,8)));

-- Keep place_order in sync (adds size_label to order items)
CREATE OR REPLACE FUNCTION public.place_order(_address jsonb, _items jsonb, _payment_method text, _txn_id text, _payment_phone text, _notes text, _coupon_code text DEFAULT ''::text)
 RETURNS TABLE(id uuid, order_number text, total numeric, discount numeric, coupon_code text)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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
    INSERT INTO public.order_items(order_id, product_id, variant_id, product_name, brand_name, size_ml, size_label, unit_price, quantity, image_url)
    VALUES (new_order.id, v_product.id, v_variant.id, v_product.name, COALESCE(v_brand.name, ''), v_variant.size_ml, v_variant.size_label, unit, qty, v_product.image_url);
  END LOOP;

  RETURN QUERY SELECT new_order.id, new_order.order_number, new_order.total, new_order.discount, new_order.coupon_code;
END;
$function$;
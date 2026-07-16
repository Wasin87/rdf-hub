CREATE OR REPLACE FUNCTION public.validate_coupon(_code text, _subtotal numeric)
 RETURNS TABLE(code text, discount_type text, discount_value numeric, discount numeric, min_order numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  c public.coupons;
  d numeric := 0;
BEGIN
  IF _code IS NULL OR length(btrim(_code)) = 0 THEN
    RAISE EXCEPTION 'Coupon code is required';
  END IF;
  SELECT * INTO c FROM public.coupons WHERE upper(public.coupons.code) = upper(btrim(_code)) LIMIT 1;
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
$function$;
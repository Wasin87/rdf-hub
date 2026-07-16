REVOKE EXECUTE ON FUNCTION public.validate_coupon(text, numeric) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_coupon(text, numeric) FROM anon;
REVOKE EXECUTE ON FUNCTION public.validate_coupon(text, numeric) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric) TO service_role;

-- Lock down SECURITY DEFINER functions from direct API execution
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reviews_guard() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.apply_coupon_internal(text, numeric) FROM PUBLIC, anon, authenticated;

-- validate_coupon is legitimately called from the client during checkout preview.
-- Restrict to signed-in users only.
REVOKE ALL ON FUNCTION public.validate_coupon(text, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric) TO authenticated;

-- has_role is used inside RLS policies; keep it callable by authenticated (and service_role).
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

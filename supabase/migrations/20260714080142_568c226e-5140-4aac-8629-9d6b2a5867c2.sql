DROP POLICY IF EXISTS "Coupons public read active" ON public.coupons;

REVOKE SELECT (email) ON public.reviews FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_reviews()
RETURNS SETOF public.reviews
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT r.*
  FROM public.reviews r
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY r.created_at DESC
$$;

REVOKE ALL ON FUNCTION public.admin_list_reviews() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_reviews() TO authenticated;
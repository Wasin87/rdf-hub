
-- 1) Protect reviewer email from anon by revoking column-level access
REVOKE SELECT ON public.reviews FROM anon;
GRANT SELECT (id, user_id, product_id, author_name, rating, title, body, is_approved, is_featured, created_at, images, order_id) ON public.reviews TO anon;

-- Also restrict authenticated: they should not read other users' emails via base table
REVOKE SELECT ON public.reviews FROM authenticated;
GRANT SELECT (id, user_id, product_id, author_name, rating, title, body, is_approved, is_featured, created_at, images, order_id, email) ON public.reviews TO authenticated;
-- Note: RLS still restricts row visibility; email column readable only by admin/owner via row policies.
-- To fully hide email from non-owner authenticated users, revoke column and rely on admin_list_reviews for admin surfaces:
REVOKE SELECT (email) ON public.reviews FROM authenticated;
GRANT SELECT (email) ON public.reviews TO service_role;

-- 2) Convert admin_list_reviews to SECURITY INVOKER and lock EXECUTE
ALTER FUNCTION public.admin_list_reviews() SECURITY INVOKER;
REVOKE EXECUTE ON FUNCTION public.admin_list_reviews() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_reviews() TO service_role;

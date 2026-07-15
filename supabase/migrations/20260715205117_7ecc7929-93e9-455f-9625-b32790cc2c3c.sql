REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_delete_review(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_set_review_state(uuid, boolean, boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_reviews() FROM anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_review(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_set_review_state(uuid, boolean, boolean) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_reviews() TO authenticated, service_role;
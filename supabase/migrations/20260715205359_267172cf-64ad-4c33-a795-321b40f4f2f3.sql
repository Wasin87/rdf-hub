CREATE OR REPLACE FUNCTION public.admin_list_reviews()
RETURNS SETOF public.reviews
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  SELECT r.*
  FROM public.reviews r
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY r.created_at DESC
$function$;

REVOKE ALL ON FUNCTION public.admin_list_reviews() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_reviews() TO authenticated, service_role;

DROP FUNCTION IF EXISTS public.admin_set_review_state(uuid, boolean, boolean);
DROP FUNCTION IF EXISTS public.admin_delete_review(uuid);
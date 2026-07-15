CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_list_reviews()
RETURNS SETOF public.reviews
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT r.*
  FROM public.reviews r
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY r.created_at DESC
$function$;

REVOKE ALL ON FUNCTION public.admin_list_reviews() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_reviews() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_set_review_state(
  _review_id uuid,
  _is_approved boolean DEFAULT NULL,
  _is_featured boolean DEFAULT NULL
)
RETURNS public.reviews
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  updated_review public.reviews;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  UPDATE public.reviews
  SET
    is_approved = COALESCE(_is_approved, is_approved),
    is_featured = COALESCE(_is_featured, is_featured)
  WHERE id = _review_id
  RETURNING * INTO updated_review;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'review not found' USING ERRCODE = 'P0002';
  END IF;

  RETURN updated_review;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_set_review_state(uuid, boolean, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_review_state(uuid, boolean, boolean) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_delete_review(_review_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.reviews
  WHERE id = _review_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_delete_review(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_review(uuid) TO authenticated, service_role;

ALTER TABLE public.reviews ALTER COLUMN is_approved SET DEFAULT true;
ALTER TABLE public.reviews ALTER COLUMN is_featured SET DEFAULT false;
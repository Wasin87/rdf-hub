
-- Switch has_role to SECURITY INVOKER so it is no longer a SECURITY DEFINER function
-- callable by anon/authenticated outside its intended scope. user_roles already has
-- a select_own policy so callers can still verify their own role.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Trigger-only SECURITY DEFINER functions: revoke EXECUTE from public/anon/authenticated.
-- Triggers are invoked by the database engine and do not require an EXECUTE grant.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM authenticated;

-- notifications: add INSERT and DELETE policies scoped to the owning user.
DROP POLICY IF EXISTS notifications_insert_own ON public.notifications;
CREATE POLICY notifications_insert_own ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS notifications_delete_own ON public.notifications;
CREATE POLICY notifications_delete_own ON public.notifications
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- reviews: stop exposing reviewer email through the public read policy.
-- Drop the table-level public read policy and expose approved reviews through a
-- view that omits the email column. The view runs with owner privileges
-- (definer semantics) so it bypasses RLS and only returns safe columns.
DROP POLICY IF EXISTS reviews_public_read ON public.reviews;

CREATE OR REPLACE VIEW public.reviews_public AS
  SELECT id, user_id, product_id, author_name, rating, title, body, images,
         is_featured, created_at, order_id
  FROM public.reviews
  WHERE is_approved = true;

GRANT SELECT ON public.reviews_public TO anon, authenticated;

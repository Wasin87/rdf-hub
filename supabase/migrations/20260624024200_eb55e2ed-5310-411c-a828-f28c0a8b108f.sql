
-- Make the public reviews view honour the caller's RLS instead of running as owner.
ALTER VIEW public.reviews_public SET (security_invoker = on);

-- Re-add a public read policy on the base table so the view (and direct safe-column
-- reads) can return approved rows.
DROP POLICY IF EXISTS reviews_public_read ON public.reviews;
CREATE POLICY reviews_public_read ON public.reviews
  FOR SELECT
  USING (is_approved = true);

-- Prevent anonymous visitors from selecting the email column directly on the base table.
-- Authenticated owners (via reviews_select_own) and admins (via reviews_admin_all) can still
-- read it; the view never exposes it.
REVOKE SELECT (email) ON public.reviews FROM anon;
REVOKE SELECT (email) ON public.reviews FROM PUBLIC;

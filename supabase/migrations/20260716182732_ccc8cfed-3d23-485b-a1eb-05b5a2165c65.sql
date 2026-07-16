-- has_role is invoked from RLS policies on public catalog tables (products, brands, categories, collections, banners, etc.).
-- Previous hardening revoked EXECUTE from anon/authenticated, which caused every anonymous read to fail with
-- "permission denied for function has_role" and broke the public site for logged-out visitors.
-- Re-grant EXECUTE. The function itself is a simple SECURITY DEFINER lookup and safe to expose.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;
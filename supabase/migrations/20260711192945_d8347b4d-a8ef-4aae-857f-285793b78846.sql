REVOKE SELECT (email) ON public.reviews FROM anon, authenticated;
GRANT SELECT (email) ON public.reviews TO service_role;
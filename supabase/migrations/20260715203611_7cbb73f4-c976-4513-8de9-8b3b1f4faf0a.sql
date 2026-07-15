
DROP POLICY IF EXISTS "Authenticated users can read payment settings" ON public.payment_settings;

CREATE POLICY "Admins can read payment settings"
ON public.payment_settings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.get_payment_number(_method text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE lower(_method)
    WHEN 'bkash' THEN bkash_number
    WHEN 'nagad' THEN nagad_number
    WHEN 'rocket' THEN rocket_number
    ELSE NULL
  END
  FROM public.payment_settings
  WHERE id = 'global'
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_payment_number(text) TO anon, authenticated;

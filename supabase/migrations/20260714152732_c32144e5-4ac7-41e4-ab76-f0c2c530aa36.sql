-- Remove anonymous/public read access to payment phone numbers.
-- Payment numbers are now only readable by authenticated users (checkout + admin profile).

REVOKE SELECT ON public.payment_settings FROM anon;

DROP POLICY IF EXISTS "Anyone can read payment settings" ON public.payment_settings;

CREATE POLICY "Authenticated users can read payment settings"
  ON public.payment_settings FOR SELECT
  TO authenticated
  USING (true);
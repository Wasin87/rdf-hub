
CREATE TABLE public.order_admin_meta (
  order_id uuid PRIMARY KEY REFERENCES public.orders(id) ON DELETE CASCADE,
  otp text,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_admin_meta TO authenticated;
GRANT ALL ON public.order_admin_meta TO service_role;
ALTER TABLE public.order_admin_meta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_admin_meta_admin_all" ON public.order_admin_meta
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_order_admin_meta_updated
  BEFORE UPDATE ON public.order_admin_meta
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.order_admin_meta (order_id, otp, admin_notes)
  SELECT id, otp, admin_notes FROM public.orders
  WHERE otp IS NOT NULL OR admin_notes IS NOT NULL;

ALTER TABLE public.orders DROP COLUMN IF EXISTS otp;
ALTER TABLE public.orders DROP COLUMN IF EXISTS admin_notes;

-- Reviews: hide email from public / authenticated reads. INSERT still allowed.
REVOKE SELECT (email) ON public.reviews FROM anon, authenticated;

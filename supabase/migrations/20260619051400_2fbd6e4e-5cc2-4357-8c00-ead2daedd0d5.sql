CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  alt_text text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id, sort_order);
GRANT SELECT ON public.product_images TO anon, authenticated;
GRANT ALL ON public.product_images TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.product_images TO authenticated;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read product images" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "Admins manage product images" ON public.product_images FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
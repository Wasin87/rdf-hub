
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS images jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL;

DROP POLICY IF EXISTS reviews_update_own ON public.reviews;
CREATE POLICY reviews_update_own ON public.reviews
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS reviews_delete_own ON public.reviews;
CREATE POLICY reviews_delete_own ON public.reviews
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS reviews_select_own ON public.reviews;
CREATE POLICY reviews_select_own ON public.reviews
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "review_images_public_read" ON storage.objects;
CREATE POLICY "review_images_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'review-images');

DROP POLICY IF EXISTS "review_images_user_insert" ON storage.objects;
CREATE POLICY "review_images_user_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'review-images' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "review_images_user_delete" ON storage.objects;
CREATE POLICY "review_images_user_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'review-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Drop broad SELECT policies that allowed listing objects. Buckets remain public,
-- so direct object URLs (/storage/v1/object/public/...) still resolve, but the
-- storage list API no longer returns every file.
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "review_images_public_read" ON storage.objects;
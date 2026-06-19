
-- Phase 2: order statuses, notice banners, payment fields, password reset flag

-- 1) Extend order_status enum (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'in_progress' AND enumtypid = 'order_status'::regtype) THEN
    ALTER TYPE order_status ADD VALUE 'in_progress' AFTER 'processing';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'resolved' AND enumtypid = 'order_status'::regtype) THEN
    ALTER TYPE order_status ADD VALUE 'resolved' AFTER 'delivered';
  END IF;
END $$;

-- 2) Order payment fields
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS txn_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_phone text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS admin_notes text;

-- 3) Profiles flag for forced password reset on first login
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;

-- 4) Notice banners table (announcement bar)
CREATE TABLE IF NOT EXISTS public.notice_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  link_url text,
  icon text,
  is_active boolean NOT NULL DEFAULT true,
  order_index integer NOT NULL DEFAULT 0,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.notice_banners TO anon, authenticated;
GRANT ALL ON public.notice_banners TO service_role;

ALTER TABLE public.notice_banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notice_banners_public_read" ON public.notice_banners;
CREATE POLICY "notice_banners_public_read" ON public.notice_banners
  FOR SELECT USING (
    is_active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at >= now())
  );

DROP POLICY IF EXISTS "notice_banners_admin_all" ON public.notice_banners;
CREATE POLICY "notice_banners_admin_all" ON public.notice_banners
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS trg_notice_banners_updated ON public.notice_banners;
CREATE TRIGGER trg_notice_banners_updated BEFORE UPDATE ON public.notice_banners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) Admin-write RLS for catalog tables (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='brands' AND policyname='brands_admin_all') THEN
    CREATE POLICY "brands_admin_all" ON public.brands FOR ALL
      USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='categories' AND policyname='categories_admin_all') THEN
    CREATE POLICY "categories_admin_all" ON public.categories FOR ALL
      USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='collections' AND policyname='collections_admin_all') THEN
    CREATE POLICY "collections_admin_all" ON public.collections FOR ALL
      USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='product_variants' AND policyname='product_variants_admin_all') THEN
    CREATE POLICY "product_variants_admin_all" ON public.product_variants FOR ALL
      USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reviews' AND policyname='reviews_admin_all') THEN
    CREATE POLICY "reviews_admin_all" ON public.reviews FOR ALL
      USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_admin_read') THEN
    CREATE POLICY "profiles_admin_read" ON public.profiles FOR SELECT
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_roles' AND policyname='user_roles_admin_all') THEN
    CREATE POLICY "user_roles_admin_all" ON public.user_roles FOR ALL
      USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='order_items' AND policyname='order_items_admin_update') THEN
    CREATE POLICY "order_items_admin_update" ON public.order_items FOR UPDATE
      USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

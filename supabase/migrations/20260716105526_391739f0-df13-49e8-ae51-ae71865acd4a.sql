
-- Revoke EXECUTE on trigger SECURITY DEFINER functions (they run via triggers, no direct call needed)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reviews_guard() FROM PUBLIC, anon, authenticated;

-- Drop duplicate admin policy on product_variants
DROP POLICY IF EXISTS variants_admin_all ON public.product_variants;

-- Add explicit INSERT/DELETE policies on order_items (admin-only; user order creation goes through place_order SECURITY DEFINER)
CREATE POLICY order_items_admin_insert ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY order_items_admin_delete ON public.order_items
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

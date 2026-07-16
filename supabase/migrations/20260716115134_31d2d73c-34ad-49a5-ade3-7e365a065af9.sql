
ALTER FUNCTION public.place_order(jsonb, jsonb, text, text, text, text) SECURITY INVOKER;

CREATE POLICY "orders_insert_own" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "order_items_insert_own" ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid()));

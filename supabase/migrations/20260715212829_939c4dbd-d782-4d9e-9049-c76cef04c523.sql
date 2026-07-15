-- Fix notifications update policy: add WITH CHECK to prevent reassignment
DROP POLICY IF EXISTS notifications_update_own ON public.notifications;
CREATE POLICY notifications_update_own ON public.notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Convert get_payment_number to SECURITY INVOKER so it does not run as definer for signed-in users
CREATE OR REPLACE FUNCTION public.get_payment_number(_method text)
 RETURNS text
 LANGUAGE sql
 STABLE
 SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
  SELECT CASE lower(_method)
    WHEN 'bkash' THEN bkash_number
    WHEN 'nagad' THEN nagad_number
    WHEN 'rocket' THEN rocket_number
    ELSE NULL
  END
  FROM public.payment_settings
  WHERE id = 'global'
  LIMIT 1;
$function$;

-- Convert admin_list_reviews to SECURITY INVOKER (RLS on reviews already lets admins read all)
CREATE OR REPLACE FUNCTION public.admin_list_reviews()
 RETURNS SETOF public.reviews
 LANGUAGE sql
 STABLE
 SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
  SELECT r.*
  FROM public.reviews r
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY r.created_at DESC
$function$;

CREATE OR REPLACE FUNCTION public.reviews_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  is_admin boolean := public.has_role(auth.uid(), 'admin');
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NOT is_admin THEN
      -- Customer reviews are auto-approved (active) by default; admin may deactivate later.
      NEW.is_approved := COALESCE(NEW.is_approved, true);
      NEW.is_featured := false;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NOT is_admin THEN
      NEW.is_approved := OLD.is_approved;
      NEW.is_featured := OLD.is_featured;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$function$;

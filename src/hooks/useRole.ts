import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

type RoleState = {
  isAdmin: boolean;
  mustChangePassword: boolean;
  loading: boolean;
};

export function useRole(): RoleState {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<RoleState>({ isAdmin: false, mustChangePassword: false, loading: true });

  useEffect(() => {
    let cancelled = false;
    if (authLoading) return;
    if (!user) { setState({ isAdmin: false, mustChangePassword: false, loading: false }); return; }
    (async () => {
      const [rolesRes, profileRes] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase.from("profiles").select("must_change_password").eq("id", user.id).maybeSingle(),
      ]);
      if (cancelled) return;
      const isAdmin = (rolesRes.data ?? []).some((r) => r.role === "admin");
      const mustChange = !!profileRes.data?.must_change_password;
      setState({ isAdmin, mustChangePassword: mustChange, loading: false });
    })();
    return () => { cancelled = true; };
  }, [user, authLoading]);

  return state;
}

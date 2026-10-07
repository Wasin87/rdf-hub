import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  staticData: { sitemap: "exclude-subtree" },
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth", search: { mode: "login" } as never });
    // Force password reset if flagged (skip on the reset-password page itself)
    if (location.pathname !== "/reset-password") {
      const { data: profile } = await supabase.from("profiles").select("must_change_password").eq("id", data.user.id).maybeSingle();
      if (profile?.must_change_password) throw redirect({ to: "/reset-password" });
    }
    return { user: data.user };
  },
  component: () => <Outlet />,
});

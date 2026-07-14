import { createFileRoute, Link, Outlet, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Package, ShoppingBag, Megaphone, Image as ImageIcon, Users, LogOut, Tag, Star, Home as HomeIcon, Ticket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data: u, error } = await supabase.auth.getUser();
    if (error || !u.user) throw redirect({ to: "/auth", search: { mode: "login", redirect: "/admin" } as never });
    const [rolesRes, profileRes] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", u.user.id),
      supabase.from("profiles").select("must_change_password").eq("id", u.user.id).maybeSingle(),
    ]);
    const isAdmin = (rolesRes.data ?? []).some((r) => r.role === "admin");
    if (!isAdmin) throw redirect({ to: "/dashboard" });
    if (profileRes.data?.must_change_password && location.pathname !== "/reset-password") {
      throw redirect({ to: "/reset-password" });
    }
    return { user: u.user };
  },
  head: () => ({ meta: [{ title: "Admin — FRAG AVENUE" }] }),
  component: AdminLayout,
});

const items = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/notices", label: "Notice Bar", icon: Megaphone },
  { to: "/admin/banners", label: "Hero Banners", icon: ImageIcon },
  { to: "/admin/brands", label: "Brands", icon: Tag },
  { to: "/admin/reviews", label: "Reviews", icon: Star },
  { to: "/admin/coupons", label: "Coupons", icon: Ticket },
  { to: "/admin/users", label: "Users", icon: Users },
];

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  return (
    <div className="flex h-[calc(100dvh-100px)] flex-col">
      {/* Fixed horizontal top nav */}
      <div className="sticky top-0 z-30 border-b border-[color:var(--gold)]/15 bg-section/95 backdrop-blur supports-[backdrop-filter]:bg-section/80">
        <div className="flex items-center gap-3 px-3 py-3 sm:px-4 lg:px-6">
          <div className="hidden shrink-0 sm:block"><Logo /></div>
          <nav className="min-w-0 flex-1">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden rounded-lg border border-border bg-background/60 p-1.5 shadow-xl">
              {items.map((it) => {
                const active = it.exact ? pathname === it.to : pathname.startsWith(it.to);
                const Icon = it.icon;
                return (
                  <Link
                    key={it.to}
                    to={it.to as never}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-xs whitespace-nowrap shadow-xl transition-colors ${active ? "border-[color:var(--gold)]/60 bg-[color:var(--gold)]/10 text-[color:var(--gold)]" : "border-border/60 bg-background/40 text-muted-foreground hover:border-[color:var(--gold)]/40 hover:text-foreground"}`}
                  >
                    <Icon className="h-3.5 w-3.5" /> {it.label}
                  </Link>
                );
              })}
            </div>
          </nav>
          <div className="hidden shrink-0 items-center gap-2 md:flex">
            <Link to="/" className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted-foreground shadow-xl transition hover:border-[color:var(--gold)]/40 hover:text-foreground">
              <HomeIcon className="h-3.5 w-3.5" /> Storefront
            </Link>
            <button
              onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth", search: { mode: "login" } as never, replace: true }); }}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted-foreground shadow-xl transition hover:border-destructive hover:text-destructive"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable page content */}
      <main className="min-h-0 flex-1 overflow-y-auto bg-background">
        <Outlet />
      </main>
    </div>
  );
}

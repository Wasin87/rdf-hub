import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Package, ShoppingBag, Megaphone, Image as ImageIcon, Users, Tag, Star, Ticket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  return (
    <div className="flex h-[calc(100dvh-100px)] flex-col">
      {/* Fixed horizontal top nav */}
      <div className="sticky top-0 z-30 border-b border-[color:var(--gold)]/15 bg-section/95 backdrop-blur supports-[backdrop-filter]:bg-section/80">
        <div className="px-3 py-3 sm:px-4 lg:px-6">
          <nav>
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {items.map((it) => {
                const active = it.exact ? pathname === it.to : pathname.startsWith(it.to);
                const Icon = it.icon;
                return (
                  <Link
                    key={it.to}
                    to={it.to as never}
                    className={`relative inline-flex shrink-0 items-center gap-2 border-0 bg-transparent px-3 py-2.5 text-xs whitespace-nowrap transition-colors after:absolute after:bottom-0 after:left-3 after:right-3 after:h-[2px] after:origin-left after:scale-x-0 after:bg-[color:var(--gold)] after:transition-transform after:duration-300 hover:text-[color:var(--gold)] hover:after:scale-x-100 ${active ? "text-[color:var(--gold)] after:scale-x-100" : "text-muted-foreground"}`}
                  >
                    <Icon className="h-3.5 w-3.5" /> {it.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </div>


      {/* Scrollable page content */}
      <main className="min-h-0 flex-1 overflow-y-auto bg-background">
        <Outlet />
      </main>
    </div>
  );
}

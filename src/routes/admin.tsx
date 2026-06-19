import { createFileRoute, Link, Outlet, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Package, ShoppingBag, Megaphone, Image as ImageIcon, Users, LogOut, Tag, Star, Home as HomeIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data: u, error } = await supabase.auth.getUser();
    if (error || !u.user) throw redirect({ to: "/auth", search: { mode: "login", redirect: "/admin" } as never });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
    const isAdmin = (roles ?? []).some((r) => r.role === "admin");
    if (!isAdmin) throw redirect({ to: "/dashboard" });
    return { user: u.user };
  },
  head: () => ({ meta: [{ title: "Admin — RDF" }] }),
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
  { to: "/admin/users", label: "Users", icon: Users },
];

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  return (
    <div className="grid min-h-[calc(100dvh-100px)] grid-cols-1 lg:grid-cols-[260px_1fr]">
      <aside className="border-r border-[color:var(--gold)]/15 bg-section">
        <div className="sticky top-24 p-6">
          <div className="mb-6"><Logo /></div>
          <p className="mb-4 text-[10px] track-luxury text-[color:var(--gold)]">Boutique Admin</p>
          <nav className="space-y-1">
            {items.map((it) => {
              const active = it.exact ? pathname === it.to : pathname.startsWith(it.to);
              const Icon = it.icon;
              return (
                <Link key={it.to} to={it.to as never} className={`flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors ${active ? "bg-[color:var(--gold)]/10 text-[color:var(--gold)]" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
                  <Icon className="h-4 w-4" /> {it.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-6 space-y-1 border-t border-border pt-4">
            <Link to="/" className="flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground">
              <HomeIcon className="h-4 w-4" /> View Storefront
            </Link>
            <button
              onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth", search: { mode: "login" } as never, replace: true }); }}
              className="flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        </div>
      </aside>
      <main className="bg-background">
        <Outlet />
      </main>
    </div>
  );
}

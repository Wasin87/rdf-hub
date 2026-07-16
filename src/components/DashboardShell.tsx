import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Package, Heart, MapPin, Bell, Settings, ShoppingBag } from "lucide-react";

const items = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/orders", label: "Orders", icon: Package },
  { to: "/dashboard/wishlist", label: "Wishlist", icon: Heart },
  { to: "/dashboard/cart", label: "Cart", icon: ShoppingBag },
  { to: "/dashboard/addresses", label: "Addresses", icon: MapPin },
  { to: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardShell({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="container-luxury py-10 lg:py-14">
      <div className="mb-8">
        <p className="text-[11px] track-luxury text-[color:var(--gold)]">My Account</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-foreground">{title}</h1>
        {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-1">
          {items.map((it) => {
            const active = it.exact ? pathname === it.to : pathname.startsWith(it.to);
            const Icon = it.icon;
            return (
              <Link key={it.to} to={it.to as never} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm shadow-xl transition-colors ${active ? "bg-[color:var(--gold)]/10 text-[color:var(--gold)]" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
                <Icon className="h-4 w-4" /> {it.label}
              </Link>
            );
          })}
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}

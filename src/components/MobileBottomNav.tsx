import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Store, Heart } from "lucide-react";
import { IoCartOutline, IoSearch } from "react-icons/io5";
import { FaRegUser } from "react-icons/fa";
import { useCart } from "@/stores/cart";
import { useWishlist } from "@/stores/wishlist";
import { useAuth } from "@/hooks/useAuth";

const items = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/shop", label: "Shop", icon: Store },
  { to: "/dashboard/wishlist", label: "Wishlist", icon: Heart, badge: "wishlist" as const },
  { to: "/dashboard/cart", label: "Cart", icon: IoCartOutline, badge: "cart" as const },
  { to: "/dashboard", label: "Profile", icon: FaRegUser, requiresAuth: true },
];

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const cartCount = useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const wishCount = useWishlist((s) => s.items.length);
  const { user } = useAuth();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Bottom navigation"
    >
      <div className="mx-2 mb-2 rounded-2xl border border-[color:var(--gold)]/25 bg-background/80 backdrop-blur-xl shadow-luxury">
        <ul className="grid grid-cols-5">
          {items.map((it) => {
            const active = it.exact ? pathname === it.to : pathname.startsWith(it.to);
            const target = it.requiresAuth && !user ? "/auth" : it.to;
            const count = it.badge === "cart" ? cartCount : it.badge === "wishlist" ? wishCount : 0;
            const Icon = it.icon;
            return (
              <li key={it.to}>
                <Link
                  to={target as never}
                  className={`relative flex flex-col items-center gap-1 py-2.5 text-[9px] track-luxury transition-colors ${active ? "text-[color:var(--gold)]" : "text-muted-foreground"}`}
                >
                  <span className="relative">
                    <Icon className="h-5 w-5" />
                    {count > 0 && (
                      <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[color:var(--gold)] px-1 text-[8px] font-semibold text-[color:var(--gold-foreground)]">
                        {count > 9 ? "9+" : count}
                      </span>
                    )}
                  </span>
                  {it.label}
                  {active && <span className="absolute inset-x-6 -top-px h-px bg-[color:var(--gold)]" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

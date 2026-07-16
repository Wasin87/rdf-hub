import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Package, ShoppingBag, Megaphone, Image as ImageIcon, Users, Tag, Star, Ticket, Truck, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const check = () => setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
    check();
    el.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      el.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  const scrollNext = () => {
    scrollerRef.current?.scrollBy({ left: 160, behavior: "smooth" });
  };

  return (
    <div className="flex h-[calc(100dvh-100px)] flex-col">
      {/* Fixed horizontal top nav */}
      <div className="sticky top-0 z-30 border-b border-[color:var(--gold)]/15 bg-section/95 backdrop-blur supports-[backdrop-filter]:bg-section/80">
        <div className="px-3 py-3 sm:px-4 lg:px-6">
          <nav className="relative">
            <div
              ref={scrollerRef}
              className={`flex items-center gap-1 overflow-x-auto scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${canScrollRight ? "pr-10" : ""}`}
            >
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
            {canScrollRight && (
              <button
                type="button"
                onClick={scrollNext}
                aria-label="Scroll tabs right"
                className="pointer-events-auto absolute right-0 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-[color:var(--gold)]/40 bg-background/95 text-[color:var(--gold)] shadow-md backdrop-blur transition-colors hover:bg-[color:var(--gold)]/10 lg:hidden"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
            {canScrollRight && (
              <div className="pointer-events-none absolute right-8 top-0 h-full w-8 bg-gradient-to-l from-section to-transparent lg:hidden" />
            )}
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

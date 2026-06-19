import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, User as UserIcon, LogOut } from "lucide-react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { SearchBar } from "./SearchBar";
import { CartSheet } from "./CartSheet";
import { WishlistSheet } from "./WishlistSheet";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { supabase } from "@/integrations/supabase/client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Shield } from "lucide-react";

const navItems: { label: string; to: string; dropdown?: { label: string; to: string; search?: Record<string, string> }[] }[] = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/shop" },
  {
    label: "Collection", to: "/shop",
    dropdown: [
      { label: "Men", to: "/shop", search: { category: "men" } },
      { label: "Women", to: "/shop", search: { category: "women" } },
      { label: "Unisex", to: "/shop", search: { category: "unisex" } },
    ],
  },
  {
    label: "Discount", to: "/shop",
    dropdown: [
      { label: "New Arrivals", to: "/shop", search: { filter: "new" } },
      { label: "Limited Products", to: "/shop", search: { filter: "limited" } },
    ],
  },
  { label: "About", to: "/about" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const { isAdmin } = useRole();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  return (
    <header className={`sticky top-0 z-40 transition-all duration-500 ${scrolled ? "glass-nav" : "bg-background"}`}>
      <div className="container-luxury flex h-16 items-center gap-6 lg:h-20">
        <Logo />
        <nav className="hidden flex-1 items-center justify-center gap-9 lg:flex">
          {navItems.map((item) => {
            const active = pathname === item.to && !item.dropdown;
            if (item.dropdown) {
              return (
                <div key={item.label} className="relative" onMouseEnter={() => setOpenDropdown(item.label)} onMouseLeave={() => setOpenDropdown(null)}>
                  <button className="nav-link flex items-center gap-1" data-active={active}>
                    {item.label}<ChevronDown className="h-3 w-3" />
                  </button>
                  <AnimatePresence>
                    {openDropdown === item.label && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.18 }}
                        className="absolute left-1/2 top-[calc(100%+10px)] z-50 min-w-44 -translate-x-1/2 rounded-sm border border-[color:var(--gold)]/20 bg-popover p-2 shadow-2xl"
                      >
                        {item.dropdown.map((d) => (
                          <Link
                            key={d.label} to={d.to as never} search={d.search as never}
                            className="block px-4 py-2.5 text-xs track-luxury text-foreground/85 transition-colors hover:bg-secondary hover:text-[color:var(--gold)]"
                          >{d.label}</Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }
            return (
              <Link key={item.label} to={item.to as never} className="nav-link" data-active={active}>{item.label}</Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden xl:block"><SearchBar /></div>
          <WishlistSheet />
          <CartSheet />
          <ThemeToggle />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button aria-label="Account menu" className="hidden h-9 w-9 place-items-center rounded-sm border border-[color:var(--gold)]/30 hover:border-[color:var(--gold)] hover:text-[color:var(--gold)] sm:grid">
                  <UserIcon className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-3 py-2">
                  <div className="text-[10px] track-luxury text-muted-foreground">Signed in</div>
                  <div className="truncate text-sm">{user.email}</div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/dashboard">Dashboard</Link></DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="text-[color:var(--gold)]"><Shield className="mr-2 h-3.5 w-3.5" /> Admin Panel</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild><Link to="/dashboard/orders">My Orders</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/dashboard/wishlist">Wishlist</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/dashboard/settings">Settings</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => { await supabase.auth.signOut(); window.location.assign("/"); }}>
                  <LogOut className="mr-2 h-3.5 w-3.5" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-1.5 sm:flex">
              <Link to="/auth" search={{ mode: "login" } as never} className="px-3 py-2 text-[11px] track-luxury text-foreground hover:text-[color:var(--gold)]">Login</Link>
              <Link to="/auth" search={{ mode: "register" } as never} className="rounded-sm border border-[color:var(--gold)] px-3 py-2 text-[11px] track-luxury text-[color:var(--gold)] transition-all hover:bg-[color:var(--gold)] hover:text-[color:var(--gold-foreground)]">Register</Link>
            </div>
          )}
          <button onClick={() => setMobileOpen((o) => !o)} aria-label="Menu" className="grid h-9 w-9 place-items-center lg:hidden">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      <div className="hairline" />

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border bg-background lg:hidden"
          >
            <div className="container-luxury flex flex-col gap-1 py-5">
              <div className="mb-3"><SearchBar inDrawer /></div>
              {navItems.map((item) => (
                <div key={item.label}>
                  <Link to={item.to as never} className="block py-2.5 text-sm track-luxury">{item.label}</Link>
                  {item.dropdown && (
                    <div className="ml-4 flex flex-col">
                      {item.dropdown.map((d) => (
                        <Link key={d.label} to={d.to as never} search={d.search as never} className="py-1.5 text-xs text-muted-foreground hover:text-[color:var(--gold)]">{d.label}</Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {!user && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link to="/auth" search={{ mode: "login" } as never} className="rounded-sm border border-border py-2.5 text-center text-xs track-luxury">Login</Link>
                  <Link to="/auth" search={{ mode: "register" } as never} className="rounded-sm bg-[color:var(--gold)] py-2.5 text-center text-xs track-luxury text-[color:var(--gold-foreground)]">Register</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

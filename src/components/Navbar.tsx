import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, LogOut, Search, LayoutDashboard, Heart, ShoppingBag, Settings as SettingsIcon, Shield } from "lucide-react";
import { TbUserHexagon } from "react-icons/tb";
import { FaSearchengin } from "react-icons/fa";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { SearchModal } from "./SearchModal";
import { CartSheet } from "./CartSheet";
import { WishlistSheet } from "./WishlistSheet";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { supabase } from "@/integrations/supabase/client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const navItems: { label: string; to: string; dropdown?: { heading?: string; items: { label: string; to: string; search?: Record<string, string> }[] }[] }[] = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/shop" },
  {
    label: "Collection", to: "/shop",
    dropdown: [
      { heading: "By Recipient", items: [
        { label: "Men", to: "/shop", search: { category: "men" } },
        { label: "Women", to: "/shop", search: { category: "women" } },
        { label: "Unisex", to: "/shop", search: { category: "unisex" } },
      ]},
      { heading: "Featured", items: [
        { label: "Discount", to: "/shop", search: { filter: "discount" } },
        { label: "New Arrivals", to: "/shop", search: { filter: "new" } },
        { label: "Limited Products", to: "/shop", search: { filter: "limited" } },
      ]},
    ],
  },
  { label: "Our Story", to: "/our-story" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileGroupOpen, setMobileGroupOpen] = useState<Record<string, boolean>>({});
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const { isAdmin } = useRole();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); setSearchOpen(false); }, [pathname]);

  const iconBtn = "grid h-10 w-10 place-items-center rounded-full text-foreground transition-all duration-300 hover:scale-110 hover:bg-secondary hover:text-[color:var(--gold)] active:scale-95";

  return (
    <header className={`sticky top-0 z-40 transition-all duration-500 ${scrolled ? "glass-nav" : "bg-background"}`}>
      <div className="container-luxury grid h-16 grid-cols-[auto_1fr_auto] items-center gap-4 lg:h-20 lg:grid-cols-3">
        {/* LEFT: nav (desktop) / menu (mobile) */}
        <div className="flex items-center">
          <div className="relative lg:hidden">
            <button onClick={() => setMobileOpen((o) => !o)} aria-label="Menu" aria-expanded={mobileOpen} className="grid h-9 w-9 place-items-center">
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <AnimatePresence>
              {mobileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMobileOpen(false)} aria-hidden />
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                    className="absolute left-0 top-[calc(100%+10px)] z-50 w-[86vw] max-w-[340px] overflow-hidden rounded-lg border border-[color:var(--gold)]/25 bg-popover shadow-2xl"
                  >
                    <div className="max-h-[70vh] overflow-y-auto overscroll-contain p-3">
                      <button onClick={() => { setMobileOpen(false); setSearchOpen(true); }} className="mb-3 flex h-10 w-full items-center gap-2 rounded-md border border-border bg-card px-3 text-xs text-muted-foreground hover:border-[color:var(--gold)]/40">
                        <FaSearchengin className="h-4 w-4 text-[color:var(--gold)]" /> Search fragrances...
                      </button>
                      <div className="flex flex-col">
                        {navItems.map((item) => {
                          if (item.dropdown) {
                            const open = !!mobileGroupOpen[item.label];
                            return (
                              <div key={item.label} className="border-b border-border/50 last:border-b-0">
                                <button
                                  onClick={() => setMobileGroupOpen((s) => ({ ...s, [item.label]: !s[item.label] }))}
                                  className="flex w-full items-center justify-between px-2 py-2.5 text-sm track-luxury text-foreground hover:text-[color:var(--gold)]"
                                  aria-expanded={open}
                                >
                                  <span>{item.label}</span>
                                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180 text-[color:var(--gold)]" : ""}`} />
                                </button>
                                <AnimatePresence initial={false}>
                                  {open && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="pb-2 pl-3">
                                        {item.dropdown.map((g) => (
                                          <div key={g.heading} className="mb-1.5 last:mb-0">
                                            {g.heading && <div className="px-2 pb-1 pt-1 text-[9px] track-luxury text-[color:var(--gold)]">{g.heading}</div>}
                                            {g.items.map((d) => (
                                              <Link key={d.label} to={d.to as never} search={d.search as never} className="block rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-[color:var(--gold)]">
                                                {d.label}
                                              </Link>
                                            ))}
                                          </div>
                                        ))}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          }
                          return (
                            <Link key={item.label} to={item.to as never} className="border-b border-border/50 px-2 py-2.5 text-sm track-luxury text-foreground last:border-b-0 hover:text-[color:var(--gold)]">
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>
                      {!user && (
                        <Link to="/auth" search={{ mode: "login" } as never} className="mt-3 block rounded-md bg-[color:var(--gold)] py-2.5 text-center text-xs track-luxury text-[color:var(--gold-foreground)]">Login</Link>
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          <nav className="hidden items-center gap-7 lg:flex whitespace-nowrap">
            {navItems.map((item) => {
              const active = pathname === item.to && !item.dropdown;
              if (item.dropdown) {
                return (
                  <div key={item.label} className="relative" onMouseEnter={() => setOpenDropdown(item.label)} onMouseLeave={() => setOpenDropdown(null)}>
                    <button className="nav-link flex items-center gap-1 whitespace-nowrap" data-active={active}>
                      {item.label}<ChevronDown className="h-3 w-3" />
                    </button>
                    <AnimatePresence>
                      {openDropdown === item.label && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.18 }}
                          className="absolute left-0 top-[calc(100%+10px)] z-50 min-w-64 rounded-lg border border-border bg-popover p-3 shadow-xl"
                        >
                          {item.dropdown.map((group) => (
                            <div key={group.heading} className="mb-2 last:mb-0">
                              {group.heading && (
                                <div className="px-3 pb-1.5 pt-1 text-[9px] track-luxury text-[color:var(--gold)]">{group.heading}</div>
                              )}
                              {group.items.map((d) => (
                                <Link
                                  key={d.label} to={d.to as never} search={d.search as never}
                                  className="block px-3 py-2 text-xs track-luxury text-foreground/85 transition-colors hover:bg-secondary hover:text-[color:var(--gold)]"
                                >{d.label}</Link>
                              ))}
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }
              return (
                <Link key={item.label} to={item.to as never} className="nav-link whitespace-nowrap" data-active={active}>{item.label}</Link>
              );
            })}
          </nav>
        </div>

        {/* CENTER: logo */}
        <div className="flex justify-center">
          <Logo />
        </div>

        {/* RIGHT: icons */}
        <div className="flex items-center justify-end gap-1.5 sm:gap-2">
          <button onClick={() => setSearchOpen(true)} aria-label="Open search" className={iconBtn}>
            <FaSearchengin className="h-5 w-5" />
          </button>
          <div className="hidden sm:block"><WishlistSheet /></div>
          <CartSheet />
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button aria-label="Account menu" className={iconBtn}>
                  <TbUserHexagon className="h-[18px] w-[18px]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <Link to="/profile" className="block px-3 py-2.5 transition-colors hover:bg-secondary">
                  <div className="truncate text-sm font-medium">{user.user_metadata?.full_name || user.email?.split("@")[0]}</div>
                  <div className="truncate text-[11px] text-muted-foreground">{user.email}</div>
                  <div className="mt-1 text-[10px] track-luxury text-[color:var(--gold)]">View profile →</div>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/dashboard"><LayoutDashboard className="mr-2 h-3.5 w-3.5" /> Dashboard</Link></DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="text-[color:var(--gold)]"><Shield className="mr-2 h-3.5 w-3.5" /> Admin Panel</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild><Link to="/dashboard/orders"><ShoppingBag className="mr-2 h-3.5 w-3.5" /> Orders</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/dashboard/wishlist"><Heart className="mr-2 h-3.5 w-3.5" /> Wishlist</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/dashboard/settings"><SettingsIcon className="mr-2 h-3.5 w-3.5" /> Settings</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => { await supabase.auth.signOut(); window.location.assign("/"); }}>
                  <LogOut className="mr-2 h-3.5 w-3.5" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {/* Theme toggle — always to the RIGHT of cart (and right of profile when signed in) */}
          <ThemeToggle />
          {!user && (
            <Link to="/auth" search={{ mode: "login" } as never} className="hidden rounded-sm border border-[color:var(--gold)]/40 px-3 py-2 text-[11px] track-luxury text-foreground transition-all hover:border-[color:var(--gold)] hover:text-[color:var(--gold)] sm:inline-block">
              Login
            </Link>
          )}
        </div>
      </div>
      <div className="hairline" />

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

    </header>
  );
}

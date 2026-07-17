import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Mail, Phone } from "lucide-react";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-0 border-t border-[color:var(--gold)]/30 bg-black text-white">
      <div className="container-luxury py-16">
        <div className="grid grid-cols-2 gap-8 sm:gap-10 lg:grid-cols-4">
          <div className="col-span-2 lg:col-span-1 [&_.font-display]:!text-white [&_.uppercase]:!text-white/80">

            <Logo compact />

            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/70">
              Curated luxury fragrance decants. Authentic, beautifully presented, delivered with discretion.
            </p>
            <div className="mt-6 flex gap-2">
              {[
                { Icon: Instagram, href: "https://www.instagram.com/fragavenuebd?igsh=aXEwdjRhOWhqMW8w&utm_source=qr", label: "Instagram" },
                { Icon: Facebook, href: "https://facebook.com/fragavenuebd", label: "Facebook" },
                { Icon: Mail, href: "mailto:fragavenuebd@gmail.com", label: "Email" },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith("mailto:") ? undefined : "_blank"}
                  rel={href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                  aria-label={label}
                  className="grid h-9 w-9 place-items-center rounded-sm border border-[color:var(--gold)]/40 text-white/80 transition-all hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]"
                >
                  <Icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="mb-4 text-[11px] track-luxury text-[color:var(--gold)]">Boutique</h4>
            <ul className="space-y-2.5 text-sm text-white/75">
              <li><Link to="/shop" className="hover:text-[color:var(--gold)]">Shop All</Link></li>
              <li><Link to="/shop" search={{ category: "men" } as never} className="hover:text-[color:var(--gold)]">Men</Link></li>
              <li><Link to="/shop" search={{ category: "women" } as never} className="hover:text-[color:var(--gold)]">Women</Link></li>
              <li><Link to="/shop" search={{ category: "unisex" } as never} className="hover:text-[color:var(--gold)]">Unisex</Link></li>
              <li><Link to="/shop" search={{ filter: "new" } as never} className="hover:text-[color:var(--gold)]">New Arrivals</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-[11px] track-luxury text-[color:var(--gold)]">Maison</h4>
            <ul className="space-y-2.5 text-sm text-white/75">
              <li><Link to="/about" className="hover:text-[color:var(--gold)]">Our Story</Link></li>
              <li><a href="#" className="hover:text-[color:var(--gold)]">Authenticity</a></li>
              <li><a href="#" className="hover:text-[color:var(--gold)]">Shipping &amp; Returns</a></li>
              <li><a href="#" className="hover:text-[color:var(--gold)]">Privacy</a></li>
              <li><a href="#" className="hover:text-[color:var(--gold)]">Terms</a></li>
            </ul>
          </div>
          <div className="col-span-2 lg:col-span-1">

            <h4 className="mb-4 text-[11px] track-luxury text-[color:var(--gold)]">Stay Connected</h4>
            <p className="mb-3 text-sm text-white/75">Receive private invitations and new releases.</p>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const input = (e.currentTarget.elements.namedItem("email") as HTMLInputElement | null);
                const email = input?.value?.trim();
                if (!email) return;
                window.location.href = `mailto:fragavenuebd@gmail.com?subject=${encodeURIComponent("Newsletter signup")}&body=${encodeURIComponent(`Please add me to the FRAG AVENUE newsletter: ${email}`)}`;
              }}
            >
              <input name="email" type="email" required placeholder="your@email.com" className="h-10 flex-1 rounded-sm border border-white/20 bg-white/10 px-3 text-xs text-white placeholder:text-white/50 focus:border-[color:var(--gold)] focus:outline-none" />
              <button className="rounded-sm bg-[color:var(--gold)] px-4 text-[10px] track-luxury text-[color:var(--gold-foreground)] transition-transform hover:scale-105">Join</button>
            </form>
            <div className="mt-5 space-y-1.5 text-xs text-white/70">
              <a href="tel:+8801861490608" className="flex items-center gap-2 hover:text-[color:var(--gold)]"><Phone className="h-3 w-3 text-[color:var(--gold)]" /> 01861-490608</a>
              <a href="mailto:fragavenuebd@gmail.com" className="flex items-center gap-2 hover:text-[color:var(--gold)]"><Mail className="h-3 w-3 text-[color:var(--gold)]" /> fragavenuebd@gmail.com</a>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/15 pt-6 sm:flex-row">
          <p className="text-[11px] text-white/60">© {new Date().getFullYear()} FRAG AVENUE. All rights reserved.</p>
          <p className="text-[10px] track-luxury text-white/60">Crafted with discernment in Bangladesh</p>
        </div>
      </div>
    </footer>
  );
}

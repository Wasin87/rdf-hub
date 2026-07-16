import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet, Link, createRootRouteWithContext, useRouter,
  HeadContent, Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { FloatingStack } from "@/components/FloatingStack";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="text-[11px] track-luxury text-[color:var(--gold)]">Lost in the Maison</p>
        <h1 className="mt-3 font-display text-7xl gold-text">404</h1>
        <p className="mt-4 text-sm text-muted-foreground">The fragrance you sought has drifted away.</p>
        <Link to="/" className="btn-liquid mt-7 inline-flex">Return Home</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl">Something went amiss</h1>
        <p className="mt-2 text-sm text-muted-foreground">A momentary disturbance in the boutique. Please try again.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="btn-liquid">Try again</button>
          <a href="/" className="rounded-sm border border-border px-5 py-3 text-[11px] track-luxury">Home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "FRAG AVENUE — Luxury Perfume Decants" },
      { name: "description", content: "Authentic luxury perfume decants from Dior, Chanel, Tom Ford, Creed, Lattafa & more. 3ml–30ml decants delivered with discretion." },
      { name: "author", content: "FRAG AVENUE" },
      { name: "theme-color", content: "#0B0B0B" },
      { property: "og:title", content: "FRAG AVENUE — Luxury Perfume Decants" },
      { property: "og:description", content: "Authentic luxury perfume decants from Dior, Chanel, Tom Ford, Creed, Lattafa & more." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "FRAG AVENUE — Luxury Perfume Decants" },
      { name: "twitter:description", content: "Authentic luxury perfume decants from Dior, Chanel, Tom Ford, Creed, Lattafa & more." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      { rel: "shortcut icon", type: "image/x-icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", href: "/favicon.ico" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <style>{`
          @keyframes fa-spin { to { transform: rotate(360deg); } }
          @keyframes fa-pulse { 0%,100% { opacity:.6; transform:translate(-50%,-50%) scale(.85);} 50% { opacity:1; transform:translate(-50%,-50%) scale(1.25);} }
          #fa-splash { position:fixed; inset:0; z-index:9999; display:grid; place-items:center; background:#0B0B0B; transition:opacity .2s ease; }
          #fa-splash .ring { position:relative; width:56px; height:56px; }
          #fa-splash .ring i { position:absolute; inset:0; border-radius:9999px; border:2px solid rgba(212,175,55,.15); }
          #fa-splash .ring i.spin { border-color:transparent; border-top-color:#D4AF37; animation: fa-spin .8s linear infinite; }
          #fa-splash .ring i.spin2 { inset:8px; border-color:transparent; border-bottom-color:rgba(212,175,55,.6); animation: fa-spin 1.2s linear infinite reverse; }
          #fa-splash .dot { position:absolute; left:50%; top:50%; width:6px; height:6px; border-radius:9999px; background:#D4AF37; animation: fa-pulse 1.2s ease-in-out infinite; }
          #fa-splash .lbl { margin-top:14px; font-size:10px; letter-spacing:.35em; color:#a1a1aa; text-align:center; text-transform:uppercase; }
          @media (prefers-color-scheme: light) { #fa-splash { background:#fafafa; } #fa-splash .lbl { color:#525252; } }
          .fa-splash-hide { opacity:0 !important; pointer-events:none; }
        `}</style>
      </head>
      <body>
        <div id="fa-splash" aria-hidden="true">
          <div>
            <div className="ring">
              <i></i><i className="spin"></i><i className="spin2"></i>
              <span className="dot"></span>
            </div>
            <div className="lbl">Loading…</div>
          </div>
        </div>
        {children}
        <Scripts />

      </body>
    </html>
  );
}



function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => {
    const s = document.getElementById("fa-splash");
    if (!s) return;
    s.classList.add("fa-splash-hide");
    const t = window.setTimeout(() => s.remove(), 260);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <div className="flex min-h-dvh flex-col bg-background text-foreground">
          <AnnouncementBar />
          <Navbar />
          <main className="flex-1 pb-20 lg:pb-0">
            <Outlet />
          </main>
          <Footer />
          <MobileBottomNav />
          <FloatingStack />
        </div>
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast: "!bg-card !text-foreground !border !border-[color:var(--gold)]/30 !rounded-sm",
              title: "!font-display",
            },
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

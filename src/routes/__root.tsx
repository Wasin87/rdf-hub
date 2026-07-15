import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet, Link, createRootRouteWithContext, useRouter,
  HeadContent, Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import faviconAsset from "@/assets/favicon.png.asset.json";
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
      { rel: "icon", type: "image/png", href: faviconAsset.url },
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
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
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

import { createFileRoute, Outlet } from "@tanstack/react-router";
import { LuxuryLoader } from "@/components/Loader";

export const Route = createFileRoute("/_authenticated/dashboard")({
  staticData: { sitemap: false },
  pendingComponent: () => <LuxuryLoader label="Loading dashboard" />,
  component: () => <Outlet />,
});

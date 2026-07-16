import { createFileRoute, Outlet } from "@tanstack/react-router";
import { LuxuryLoader } from "@/components/Loader";

export const Route = createFileRoute("/_authenticated/dashboard")({
  pendingComponent: () => <LuxuryLoader label="Loading dashboard" />,
  component: () => <Outlet />,
});

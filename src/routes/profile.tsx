import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/profile")({
  component: () => <Navigate to="/dashboard/settings" replace />,
});

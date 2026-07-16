import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { LuxuryLoader } from "@/components/Loader";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultPendingComponent: () => <LuxuryLoader label="Loading" />,
    defaultPendingMs: 0,
    defaultPendingMinMs: 300,
  });

  return router;
};

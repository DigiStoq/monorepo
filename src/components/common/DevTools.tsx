import type React from "react";
import { lazy, Suspense } from "react";
import { router } from "@/routes";

// TanStack Router DevTools - needs router prop when outside RouterProvider
const TanStackRouterDevtools = import.meta.env.PROD
  ? () => null // Render nothing in production
  : lazy(() =>
      import("@tanstack/react-router-devtools").then((res) => ({
        default: res.TanStackRouterDevtools,
      }))
    );

// React Query DevTools
const ReactQueryDevtools = import.meta.env.PROD
  ? () => null
  : lazy(() =>
      import("@tanstack/react-query-devtools").then((res) => ({
        default: res.ReactQueryDevtools,
      }))
    );

export function DevTools(): React.ReactNode {
  if (import.meta.env.PROD) return null;

  return (
    <Suspense fallback={null}>
      <TanStackRouterDevtools router={router} position="bottom-right" />
      <ReactQueryDevtools initialIsOpen={false} />
    </Suspense>
  );
}

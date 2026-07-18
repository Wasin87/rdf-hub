// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// NOTE: The @lovable.dev/mcp-js Vite plugin (mcpPlugin) was removed here to make
// the project self-hostable on Windows/local environments. Its sole responsibility
// is regenerating the auto-generated MCP route files under src/routes/ (mcp.ts,
// [.mcp]/list-tools.ts, [.mcp]/invoke-tool/$tool.ts, and
// [.well-known]/oauth-protected-resource.ts). Those files are already committed
// and continue to serve the MCP endpoints unchanged — the plugin was a
// build-time codegen helper, not a runtime dependency.
//
// The plugin threw "routesDir \"src/routes\" must resolve under ..." on Windows
// because it compared a Vite-normalized (forward-slash) project root against a
// path.resolve() result with backslashes. Skipping the plugin locally sidesteps
// that path-normalization bug without changing any app behavior. If you later
// edit src/lib/mcp/index.ts (add/remove tools), regenerate the route files by
// re-enabling this plugin in a Lovable environment, or edit those files by hand.

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});

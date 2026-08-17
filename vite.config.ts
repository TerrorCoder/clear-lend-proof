// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { fileURLToPath } from "node:url";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

// Midnight packages ship WASM + top-level await and are browser-only; they are
// only ever loaded client-side via dynamic import (see src/lib/clearlend-api.ts).
const MIDNIGHT_PACKAGES = [
  "@midnight-ntwrk/dapp-connector-api",
  "@midnight-ntwrk/midnight-js-contracts",
  "@midnight-ntwrk/midnight-js-fetch-zk-config-provider",
  "@midnight-ntwrk/midnight-js-http-client-proof-provider",
  "@midnight-ntwrk/midnight-js-indexer-public-data-provider",
  "@midnight-ntwrk/midnight-js-network-id",
  "@midnight-ntwrk/midnight-js-protocol",
  "@midnight-ntwrk/midnight-js-types",
  "@midnight-ntwrk/midnight-js-utils",
  "@midnight-ntwrk/onchain-runtime-v3",
];

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      wasm(),
      topLevelAwait(),
      {
        // The Midnight stack (WASM, window, Lace connector) is browser-only and
        // reached exclusively through dynamic imports fired by user actions.
        // Externalize the entire scope from server/SSR builds so nitro never
        // tries to bundle or evaluate it.
        name: "clearlend-externalize-midnight-on-server",
        enforce: "pre" as const,
        resolveId(source: string) {
          const env = (this as { environment?: { name?: string } }).environment;
          if (env?.name && env.name !== "client" && source.startsWith("@midnight-ntwrk/")) {
            return { id: source, external: true as const };
          }
          return null;
        },
      },
    ],
    build: {
      target: "esnext",
    },
    optimizeDeps: {
      // Only the WASM-carrying packages must stay unoptimized; the pure-JS
      // midnight-js packages go through the optimizer so their CJS deps
      // (cross-fetch, fetch-retry, …) get proper ESM interop.
      exclude: ["@midnight-ntwrk/onchain-runtime-v3", "@midnight-ntwrk/ledger-v8"],
      include: ["@midnight-ntwrk/compact-runtime"],
    },
    ssr: {
      // Never bundle the WASM-heavy Midnight stack into the server build.
      external: MIDNIGHT_PACKAGES,
    },
    resolve: {
      extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json", ".wasm"],
      alias: {
        // CJS ponyfill → native fetch (see src/shims/cross-fetch.ts).
        "cross-fetch": fileURLToPath(new URL("./src/shims/cross-fetch.ts", import.meta.url)),
      },
    },
  },
});

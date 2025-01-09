import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";
import { viteStaticCopy } from "vite-plugin-static-copy";

declare module "@remix-run/node" {
  interface Future {
    v3_singleFetch: true;
  }
}

export default defineConfig({
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./app"),
    },
  },
  plugins: [
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_singleFetch: true,
        v3_lazyRouteDiscovery: true,
      },
      buildDirectory: "prod/build",
    }),
    tsconfigPaths(),
    viteStaticCopy({
      targets: [
        { src: "server/**/*.js", dest: "../../server/lib" },
        { src: "prisma/**/*.prisma", dest: "../../prisma" },
        { src: "server.js", dest: "../../" },
        { src: "package.json", dest: "../../" },
      ],
    }),
  ],
  build: {
    outDir: "prod",
    emptyOutDir: true,
  },
});

import { createRequestHandler } from "@remix-run/express";
import compression from "compression";
import express from "express";
import morgan from "morgan";
import { createServer } from "http";
import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";
import {
  accessCookie,
  refreshCookie,
  clearAccessCookie,
  clearRefreshCookie,
} from "./server/lib/cookie.js";

// initial prisma client
const prisma = new PrismaClient();

const viteDevServer =
  process.env.NODE_ENV === "production"
    ? undefined
    : await import("vite").then((vite) =>
        vite.createServer({
          server: { middlewareMode: true },
        })
      );

const remixHandler = createRequestHandler({
  getLoadContext() {
    return {
      // prisma configruato
      prisma,

      // cookie configruation
      accessCookie,
      refreshCookie,
      clearAccessCookie,
      clearRefreshCookie,
    };
  },
  build: viteDevServer
    ? () => viteDevServer.ssrLoadModule("virtual:remix/server-build")
    : await import("./build/server/index.js"),
});

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.use(compression());

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable("x-powered-by");

// handle asset requests
if (viteDevServer) {
  app.use(viteDevServer.middlewares);
} else {
  // Vite fingerprints its assets so we can cache forever.
  app.use(
    "/assets",
    express.static("build/client/assets", { immutable: true, maxAge: "1y" })
  );
}

// Everything else (like favicon.ico) is cached for an hour. You may want to be
// more aggressive with this caching.
app.use(express.static("build/client", { maxAge: "1h" }));

app.use(morgan("tiny"));

function clientConnection(socket) {
  console.log(`client connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`client disconnected: ${socket.id}`);
  });
}

// handle socket.io request
io.on("connection", (socket) => {
  clientConnection(socket);
  console.log(socket.handshake.headers);
});

// handle SSR requests
app.all("*", remixHandler);

const port = process.env.PORT || 3000;
httpServer.listen(port, () =>
  console.log(`Express server listening at http://localhost:${port}`)
);

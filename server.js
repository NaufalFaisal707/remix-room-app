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
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "./server/lib/jwt.js";

// initial prisma client
const prisma = new PrismaClient();

const viteDevServer =
  process.env.NODE_ENV === "production"
    ? undefined
    : await import("vite").then((vite) =>
        vite.createServer({
          server: { middlewareMode: true },
        }),
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

      // jawir token configuration
      generateAccessToken,
      generateRefreshToken,
      verifyAccessToken,
      verifyRefreshToken,
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
    express.static("build/client/assets", { immutable: true, maxAge: "1y" }),
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

io.use(async (socket, next) => {
  const getAllCookie = socket.handshake.headers.cookie;

  const verifiyedAccessCookie = verifyAccessToken(
    await accessCookie.parse(getAllCookie),
  );

  if (verifiyedAccessCookie) {
    const findUniqueUser = await prisma.user.findUnique({
      where: {
        id: verifiyedAccessCookie.value,
      },
    });

    socket.user_id = findUniqueUser.id;
    socket.user_full_name = findUniqueUser.full_name;
    next();
    return;
  }

  next(new Error("woy!"));
});

// handle socket.io request
io.on("connection", async (socket) => {
  clientConnection(socket);

  socket.leave(socket.id);
  socket.join(socket.user_id);

  async function globalChatId() {
    const allSockets = await io.fetchSockets();
    const uniqueUsers = [
      ...new Set(allSockets.map((socket) => socket.user_id)),
    ];
    return uniqueUsers.map((id) => {
      const socket = allSockets.find((s) => s.user_id === id);
      return {
        chat_id: id,
        user_full_name: socket.user_full_name,
      };
    });
  }

  socket.on("ping", () => {
    console.log("client ping!");
  });

  socket.on("getAllChat", async () => {
    socket.emit("getAllChat", await globalChatId());
  });

  io.emit("getAllChat", await globalChatId());

  socket.on("disconnect", async () => {
    io.emit("getAllChat", await globalChatId());
  });

  // console.log(socket.handshake.headers.cookie);
});

// handle SSR requests
app.all("*", remixHandler);

const port = process.env.PORT || 3000;
httpServer.listen(port, () =>
  console.log(`Express server listening at http://localhost:${port}`),
);

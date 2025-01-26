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
import bcrypt from "bcryptjs";
const { hash } = bcrypt;

// initial prisma client
const prisma = new PrismaClient().$extends({
  query: {
    async $allOperations({ operation, args, model, query }) {
      if (operation === "create" && model === "User" && args.data?.password) {
        args.data.password = await hash(args.data.password, 10);
        return query(args);
      }
      return await query(args);
    },
  },
});

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

      // jwt token configuration
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

function connectedClient(socket) {
  console.log(`client connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`client disconnected: ${socket.id}`);
  });
}

io.use(async (socket, next) => {
  const { cookie } = socket.handshake.headers;

  const acp = verifyAccessToken(await accessCookie.parse(cookie));

  if (acp) {
    socket.uid = acp.id;
    socket.uname = acp.full_name;

    next();
  }

  next(new Error("gk boleh!"));
});

// handle socket.io request
io.on("connection", async (socket) => {
  connectedClient(socket);

  socket.leave(socket.id);

  socket.join("global-room");

  console.log(socket.rooms);

  const onlineUsers = (await io.fetchSockets()).map(({ uid, uname }) => ({
    uid,
    uname,
  }));

  console.log(onlineUsers);

  // async function globalChatId() {
  //   const allSockets = await io.fetchSockets();
  //   const uniqueUsers = [
  //     ...new Set(allSockets.map((socket) => socket.user_id)),
  //   ];
  //   return uniqueUsers.map((id) => {
  //     const socket = allSockets.find((s) => s.user_id === id);
  //     return {
  //       chat_id: id,
  //       user_full_name: socket.user_full_name,
  //     };
  //   });
  // }
  // socket.on("sendMessage", (data) => {
  //   const { target } = data;
  //   socket.emit("getMessage", data);
  //   socket.to(target).emit("getMessage", data);
  //   socket.to(target).emit("getNotify", data);
  // });
  // io.emit("getAllChat", await globalChatId());
  // socket.on("disconnect", async () => {
  //   io.emit("getAllChat", await globalChatId());
  // });
});

// handle SSR requests
app.all("*", remixHandler);

const port = process.env.PORT || 2453;
httpServer.listen(port, () =>
  console.log(`Express server listening at http://localhost:${port}`),
);

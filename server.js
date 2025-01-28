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
  io.emit("newUserJoin", {
    type: "badge",
    uname: socket.uname,
    status: "join",
  });

  socket.on("disconnect", () => {
    console.log(`client disconnected: ${socket.id}`);
    io.emit("newUserLeave", {
      type: "badge",
      uname: socket.uname,
      status: "leave",
    });
  });
}

io.use(async (socket, next) => {
  const { cookie } = socket.handshake.headers;

  const acp = verifyAccessToken(await accessCookie.parse(cookie));

  if (acp) {
    socket.uid = acp.id;
    socket.uname = acp.full_name;

    next();
    return;
  }

  next(new Error("gk boleh!"));
});

// handle socket.io request
io.on("connection", async (socket) => {
  connectedClient(socket);

  // get online users with multipe connection bloker
  async function fetchOnlineUsers() {
    let cstate;

    const onlineUsers = await io.fetchSockets();

    onlineUsers.forEach((fe, i) => {
      if (fe.uid === cstate) {
        fe.disconnect(true);
        onlineUsers.splice(i, 1);
      }

      cstate = fe.uid;
    });

    return onlineUsers.map(({ uid, uname }) => ({
      uid,
      uname,
    }));
  }

  // socket.on("sendMessage", (data) => {
  //   const { target } = data;
  //   socket.emit("getMessage", data);
  //   socket.to(target).emit("getMessage", data);
  //   socket.to(target).emit("getNotify", data);
  // });

  socket.on("sendMessage", (message) => {
    io.emit("newMessage", message);
  });

  io.emit("getOnlineUsers", await fetchOnlineUsers());

  socket.on("disconnect", async () => {
    io.emit("getOnlineUsers", await fetchOnlineUsers());
  });
});

// handle SSR requests
app.all("*", remixHandler);

const port = process.env.PORT || 2453;
httpServer.listen(port, () =>
  console.log(`Express server listening at http://localhost:${port}`),
);

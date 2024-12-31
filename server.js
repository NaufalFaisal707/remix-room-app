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
import { isRefreshTokenAccessable } from "./server/lib/utils.js";

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

io.engine.use(async (req, res, next) => {
  const getAllCookie = req.headers.cookie;

  const verifiyedAccessCookie = verifyAccessToken(
    await accessCookie.parse(getAllCookie)
  );

  if (verifiyedAccessCookie) {
    req.user_id = verifiyedAccessCookie.value;
    next();
    return;
  }

  const verifiyedRefreshCookie = verifyRefreshToken(
    await refreshCookie.parse(getAllCookie)
  );

  if (verifiyedRefreshCookie) {
    const findUniqueUser = await prisma.user.findUnique({
      where: {
        id: verifiyedRefreshCookie.value,
      },
      select: {
        id: true,
        full_name: true,
        created_at: true,
        logout_at: true,
      },
    });

    if (!findUniqueUser) {
      throw Response.json(null, {
        status: 404,
        headers: [
          ["Set-Cookie", await clearAccessCookie.serialize("")],
          ["Set-Cookie", await clearRefreshCookie.serialize("")],
        ],
      });
    }

    if (
      findUniqueUser?.logout_at &&
      isRefreshTokenAccessable(
        verifiyedRefreshCookie.iat,
        findUniqueUser.logout_at
      )
    ) {
      res.statusCode = 401;
      res.setHeader("Set-Cookie", [
        await clearAccessCookie.serialize(""),
        await clearRefreshCookie.serialize(""),
      ]);
      res.end();
    }

    const gac = generateAccessToken(verifiyedRefreshCookie.value);

    return Response.json(null, {
      headers: {
        "Set-Cookie": await accessCookie.serialize(gac),
      },
    });
  }

  res.statusCode = 401;
  res.setHeader("Set-Cookie", [
    await clearAccessCookie.serialize(""),
    await clearRefreshCookie.serialize(""),
  ]);
  res.end();
});

// handle socket.io request
io.on("connection", async (socket) => {
  const user = socket.request.user_id;

  const findUniqueUser = await prisma.user.findUnique({
    where: {
      id: user,
    },
    select: {
      id: true,
      full_name: true,
      created_at: true,
      logout_at: true,
    },
  });

  clientConnection(socket);

  socket.emit("getMe", findUniqueUser);
  // console.log(socket.handshake.headers.cookie);
});

// handle SSR requests
app.all("*", remixHandler);

const port = process.env.PORT || 3000;
httpServer.listen(port, () =>
  console.log(`Express server listening at http://localhost:${port}`)
);

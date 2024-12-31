import { redirect } from "@remix-run/node";
import {
  ClientLoaderFunctionArgs,
  Form,
  isRouteErrorResponse,
  Link,
  useRouteError,
} from "@remix-run/react";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { useSocket } from "~/context";
import { isRefreshTokenAccessable } from "~/lib/utils";
import { CustomLoaderFunctionArgs } from "~/types";

export const loader = async ({
  request,
  context,
}: CustomLoaderFunctionArgs) => {
  const {
    prisma,
    verifyAccessToken,
    accessCookie,
    verifyRefreshToken,
    refreshCookie,
    clearAccessCookie,
    clearRefreshCookie,
    generateAccessToken,
  } = context;

  const getAllCookie = request.headers.get("Cookie");

  const verifiyedAccessCookie = verifyAccessToken(
    await accessCookie.parse(getAllCookie)
  ) as unknown as { value: string };

  if (verifiyedAccessCookie) {
    return Response.json(true);
  }

  const verifiyedRefreshCookie = verifyRefreshToken(
    await refreshCookie.parse(getAllCookie)
  ) as unknown as { value: string; iat: number };

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
      return redirect("/", {
        headers: [
          ["Set-Cookie", await clearAccessCookie.serialize("")],
          ["Set-Cookie", await clearRefreshCookie.serialize("")],
        ],
      });
    }

    const gac = generateAccessToken(verifiyedRefreshCookie.value);

    return Response.json(null, {
      headers: {
        "Set-Cookie": await accessCookie.serialize(gac),
      },
    });
  }

  throw Response.json(null, {
    status: 401,
    headers: [
      ["Set-Cookie", await clearAccessCookie.serialize("")],
      ["Set-Cookie", await clearRefreshCookie.serialize("")],
    ],
  });
};

let cacheClientLoader: unknown;
export const clientLoader = async ({
  serverLoader,
}: ClientLoaderFunctionArgs) => {
  if (!cacheClientLoader) {
    cacheClientLoader = await serverLoader();

    return cacheClientLoader;
  }

  return cacheClientLoader;
};

const TemplateBelumLogin = () => {
  return (
    <div className="grid place-content-center h-svh">
      <Link to="/login">
        <Button>Login</Button>
      </Link>
    </div>
  );
};

const TemplateSudahLogin = ({ loaderData }: { loaderData: unknown }) => {
  return (
    <div className="grid place-content-center h-svh">
      <p>{JSON.stringify(loaderData)}</p>
      <Form action="/logout" method="POST">
        <Button>Logout</Button>
      </Form>
    </div>
  );
};

export const ErrorBoundary = () => {
  const error = useRouteError();
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.disconnect();
  }, [socket]);

  if (isRouteErrorResponse(error)) {
    // return (
    //   <div>
    //     <h1>
    //       {error.status} {error.statusText}
    //     </h1>
    //     <p>{error.data}</p>
    //   </div>
    // );

    return <TemplateBelumLogin />;
  } else if (error instanceof Error) {
    return (
      <div>
        <h1>Error</h1>
        <p>{error.message}</p>
        <p>The stack trace is:</p>
        <pre>{error.stack}</pre>
      </div>
    );
  } else {
    return <h1>Unknown Error</h1>;
  }
};

export default function Index() {
  const [loaderSocket, setLoaderSocket] = useState(null);

  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.connect();

    socket.on("getMe", (me) => {
      setLoaderSocket(me);
    });

    return () => {
      socket.disconnect();
    };
  }, [socket]);

  return <TemplateSudahLogin loaderData={loaderSocket} />;
}

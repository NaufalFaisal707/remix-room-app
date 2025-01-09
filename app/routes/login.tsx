import {
  Form,
  isRouteErrorResponse,
  Link,
  redirect,
  useRouteError,
} from "@remix-run/react";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { CustomActionFunctionArgs } from "~/types";

export const action = async ({
  request,
  context,
}: CustomActionFunctionArgs) => {
  const {
    prisma,
    accessCookie,
    refreshCookie,
    generateAccessToken,
    generateRefreshToken,
  } = context;

  const { username, password } = Object.fromEntries(
    await request.formData(),
  ) as {
    username: string;
    password: string;
  };

  const findUniqueUser = await prisma.user.findUnique({
    where: {
      username,
    },
  });

  if (!findUniqueUser) {
    throw Response.json(null, {
      status: 404,
      statusText: "akun tidak ditemukan",
    });
  }

  if (!findUniqueUser.password.includes(password)) {
    throw Response.json(null, {
      status: 401,
      statusText: "password salah",
    });
  }

  const gac = generateAccessToken(findUniqueUser.id);
  const grt = generateRefreshToken(findUniqueUser.id);

  return redirect("/", {
    headers: [
      ["Set-Cookie", await accessCookie.serialize(gac)],
      ["Set-Cookie", await refreshCookie.serialize(grt)],
    ],
  });
};

const LoginTemplate = ({
  error,
}: {
  error?: { title: string; message: string };
}) => {
  return (
    <div className="grid h-svh place-content-center gap-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>{error.title}</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4 rounded-md border p-4">
        <h1 className="text-lg">Silahkan login</h1>
        <Form method="POST" className="space-y-4">
          <Input
            required
            name="username"
            type="text"
            placeholder="username"
            maxLength={16}
          />

          <Input
            required
            name="password"
            type="password"
            placeholder="password"
            maxLength={32}
          />

          <div className="grid gap-y-2">
            <Button type="submit">Masuk</Button>
            <Button type="button" variant="outline" asChild>
              <Link to="/register">Register</Link>
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export const ErrorBoundary = () => {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <LoginTemplate
        error={{ title: error.status + "", message: error.statusText }}
      />
    );
  } else if (error instanceof Error) {
    return (
      <LoginTemplate error={{ title: "Error!", message: error.message }} />
    );
  } else {
    <LoginTemplate />;
  }
};

export default function AuthLogin() {
  return <LoginTemplate />;
}

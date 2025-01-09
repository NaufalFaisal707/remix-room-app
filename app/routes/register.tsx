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
    generateAccessToken,
    generateRefreshToken,
    accessCookie,
    refreshCookie,
  } = context;

  const { username, password, full_name } = Object.fromEntries(
    await request.formData(),
  ) as {
    full_name: string;
    username: string;
    password: string;
  };

  const findUniqueUser = await prisma.user.findUnique({
    where: {
      username,
    },
  });

  if (findUniqueUser) {
    throw Response.json(null, {
      status: 409,
      statusText: "username sudah di gunakan",
    });
  }

  const createdUser = await prisma.user.create({
    data: {
      full_name,
      username,
      password,
    },
  });

  const gac = generateAccessToken(createdUser.id);
  const grt = generateRefreshToken(createdUser.id);

  return redirect("/", {
    headers: [
      ["Set-Cookie", await accessCookie.serialize(gac)],
      ["Set-Cookie", await refreshCookie.serialize(grt)],
    ],
  });
};

const RegisterTemplate = ({
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
        <h1 className="text-lg">Silahkan register</h1>
        <Form method="POST" className="space-y-4">
          <Input
            required
            name="full_name"
            type="text"
            placeholder="full name"
            minLength={4}
            maxLength={38}
          />

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
            <Button type="submit">Buat Akun</Button>
            <Button type="button" variant="outline" asChild>
              <Link to="/login">Login</Link>
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
      <RegisterTemplate
        error={{ title: error.status + "", message: error.statusText }}
      />
    );
  } else if (error instanceof Error) {
    return (
      <RegisterTemplate error={{ title: "Error!", message: error.message }} />
    );
  } else {
    <RegisterTemplate />;
  }
};

export default function AuthRegister() {
  return <RegisterTemplate />;
}

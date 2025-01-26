import {
  ErrorResponse,
  Form,
  isRouteErrorResponse,
  Link,
  MetaFunction,
  useRouteError,
} from "@remix-run/react";
import { replace } from "@remix-run/node";
import { CircleX, Group } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { CustomActionFunctionArgs } from "~/types";
import bcrypt from "bcryptjs";
import ErrorInstance from "~/components/error-instance";
import { Alert, AlertTitle, AlertDescription } from "~/components/ui/alert";
const { compareSync } = bcrypt;

export const meta: MetaFunction = () => [{ title: "Login | Room" }];

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

  const formData = Object.fromEntries(await request.formData()) as {
    username: string;
    password: string;
  };

  const findUserByUnique = await prisma.user.findUnique({
    where: {
      username: formData.username,
    },
    select: {
      id: true,
      full_name: true,
      password: true,
    },
  });

  if (!findUserByUnique) {
    throw Response.json(null, {
      status: 404,
      statusText: "tidak ditemukan akun dari username",
    });
  }

  const isPasswordMatch = compareSync(
    formData.password,
    findUserByUnique.password,
  );

  if (!isPasswordMatch) {
    throw Response.json(null, {
      status: 401,
      statusText: "password tidak sesuai",
    });
  }

  const gat = generateAccessToken(
    findUserByUnique.id,
    findUserByUnique.full_name,
  );
  const grt = generateRefreshToken(
    findUserByUnique.id,
    findUserByUnique.full_name,
  );

  return replace("/", {
    headers: [
      ["Set-Cookie", await accessCookie.serialize(gat)],
      ["Set-Cookie", await refreshCookie.serialize(grt)],
    ],
  });
};

export const ErrorBoundary = () => {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return <LoginComponent error={error} />;
  }

  return <ErrorInstance error={error} />;
};

export default function Login() {
  return <LoginComponent />;
}

const LoginComponent = ({ error }: { error?: ErrorResponse }) => {
  return (
    <div className="grid h-svh place-content-center">
      <div className="m-4">
        <div className="mx-auto my-4 grid text-center">
          <Group className="mx-auto my-4 size-10" />
          <h1 className="text-lg font-semibold">Selamat Datang Di Room</h1>
          <p className="text-sm text-neutral-400">
            Silahkan Masuk untuk melanjutkan
          </p>
        </div>

        {!!error && (
          <Alert className="mb-4">
            <CircleX className="h-4 w-4" />
            <AlertTitle>{error?.status}</AlertTitle>
            <AlertDescription>{error?.statusText}</AlertDescription>
          </Alert>
        )}

        <Form method="POST" className="space-y-4">
          <Input
            required
            name="username"
            type="text"
            placeholder="username"
            maxLength={24}
            minLength={4}
          />

          <Input
            required
            name="password"
            type="password"
            placeholder="password"
            maxLength={32}
            minLength={4}
          />

          <div className="grid gap-y-2">
            <Button type="submit">Masuk</Button>
            <Button type="button" variant="outline" asChild>
              <Link to="/register">Daftar</Link>
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

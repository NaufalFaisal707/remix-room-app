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
import ErrorInstance from "~/components/error-instance";
import { Alert, AlertTitle, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { CustomActionFunctionArgs } from "~/types";

export const meta: MetaFunction = () => [{ title: "Register | Room" }];

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
    full_name: string;
    username: string;
    password: string;
  };

  const findUserByUnique = await prisma.user.findUnique({
    where: {
      username: formData.username,
    },
  });

  if (findUserByUnique) {
    throw Response.json(null, {
      status: 409,
      statusText: "username sudah di gunakan",
    });
  }

  const createdUser = await prisma.user
    .create({
      data: {
        ...formData,
      },
      select: {
        id: true,
        full_name: true,
      },
    })
    .catch(() => {
      throw Response.json(null, { status: 500, statusText: "server crash" });
    });

  const gat = generateAccessToken(createdUser.id, createdUser.full_name);
  const grt = generateRefreshToken(createdUser.id, createdUser.full_name);

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
    return <RegisterComponent error={error} />;
  }

  return <ErrorInstance error={error} />;
};

export default function Register() {
  return <RegisterComponent />;
}

const RegisterComponent = ({ error }: { error?: ErrorResponse }) => (
  <div className="grid h-svh place-content-center">
    <div className="m-4">
      <div className="mx-auto my-4 grid text-center">
        <Group className="mx-auto my-4 size-10" />
        <h1 className="text-lg font-semibold">Selamat Datang Di Room</h1>
        <p className="text-sm text-neutral-400">
          Silahkan Daftar untuk melanjutkan
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
          name="full_name"
          type="text"
          placeholder="nama akun"
          maxLength={48}
          minLength={4}
        />

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
          <Button type="submit">Daftarkan Akun</Button>
          <Button type="button" variant="outline" asChild>
            <Link to="/login">Masuk</Link>
          </Button>
        </div>
      </Form>
    </div>
  </div>
);

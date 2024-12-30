import { redirect } from "@remix-run/node";

import {
  clearAccessCookie,
  clearRefreshCookie,
  refreshCookie,
} from "~/lib/cookie";
import { verifyRefreshToken } from "~/lib/jwt";
import { CustomActionFunctionArgs } from "~/types";

export const action = async ({
  request,
  context,
}: CustomActionFunctionArgs) => {
  const { prisma } = context;

  const verifyedRefreshToken = verifyRefreshToken(
    await refreshCookie.parse(request.headers.get("Cookie"))
  ) as unknown as { value: string };

  if (!verifyedRefreshToken) {
    return redirect("/");
  }

  await prisma.user.update({
    where: {
      id: verifyedRefreshToken.value,
    },
    data: {
      logout_at: new Date(),
    },
  });

  return redirect("/", {
    headers: [
      ["Set-Cookie", await clearAccessCookie.serialize("")],
      ["Set-Cookie", await clearRefreshCookie.serialize("")],
    ],
  });
};

export const loader = async () => {
  return redirect("/");
};

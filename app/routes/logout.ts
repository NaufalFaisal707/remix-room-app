import { redirectDocument } from "@remix-run/node";
import { CustomLoaderFunctionArgs } from "~/types";

export const loader = async ({ context }: CustomLoaderFunctionArgs) => {
  const { clearAccessCookie, clearRefreshCookie } = context;

  return redirectDocument("/", {
    headers: [
      ["Set-Cookie", await clearAccessCookie.serialize("")],
      ["Set-Cookie", await clearRefreshCookie.serialize("")],
    ],
  });
};

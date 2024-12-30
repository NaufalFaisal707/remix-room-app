import { createCookie } from "@remix-run/node";
import { process } from "node";

const accessCookieName = "__access";
const refreshCookieName = "__refresh";

export const accessCookie = createCookie(accessCookieName);

export const refreshCookie = createCookie(refreshCookieName, {
  sameSite: "lax",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
});

export const clearAccessCookie = createCookie(accessCookieName, { maxAge: 0 });

export const clearRefreshCookie = createCookie(refreshCookieName, {
  maxAge: 0,
  sameSite: "lax",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
});

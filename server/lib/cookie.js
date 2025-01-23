import { createCookie } from "@remix-run/node";
import { getAccessExp, getRefreshExp } from "./jwt.js";

let process;
if (typeof window === "undefined") {
  process = global.process;
} else {
  process = { env: {} };
}

const accessCookieName = "__r_a";
const refreshCookieName = "__r_r";

export const accessCookie = createCookie(accessCookieName, {
  maxAge: getAccessExp(),
});

export const refreshCookie = createCookie(refreshCookieName, {
  maxAge: getRefreshExp(),
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

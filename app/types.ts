import {
  ActionFunctionArgs,
  Cookie,
  LoaderFunctionArgs,
} from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

type CustomContext = {
  context: {
    prisma: PrismaClient;
    accessCookie: Cookie;
    refreshCookie: Cookie;
    clearAccessCookie: Cookie;
    clearRefreshCookie: Cookie;
    generateAccessToken: (value: string) => string;
    generateRefreshToken: (value: string) => string;
    verifyAccessToken: (token: string) => object | null;
    verifyRefreshToken: (token: string) => object | null;
  };
};

export type CustomActionFunctionArgs = ActionFunctionArgs & CustomContext;

export type CustomLoaderFunctionArgs = LoaderFunctionArgs & CustomContext;

import {
  ActionFunctionArgs,
  Cookie,
  LoaderFunctionArgs,
} from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

type CustomCookie = {
  accessCookie: Cookie;
  refreshCookie: Cookie;
  clearAccessCookie: Cookie;
  clearRefreshCookie: Cookie;
};

type CustomContext = {
  context: { prisma: PrismaClient; cookie: CustomCookie };
};

export type CustomActionFunctionArgs = ActionFunctionArgs & CustomContext;

export type CustomLoaderFunctionArgs = LoaderFunctionArgs & CustomContext;

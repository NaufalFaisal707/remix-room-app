import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isRefreshTokenAccessable(refreshIat: number, logoutAt: Date) {
  return refreshIat * 1000 < new Date(logoutAt).getTime();
}

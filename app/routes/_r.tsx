import { Outlet } from "@remix-run/react";

export const loader = () => {
  console.log("_r loaded!");

  return null;
};

export default function Room() {
  return <Outlet />;
}

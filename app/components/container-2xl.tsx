import { ReactNode } from "react";
import { cn } from "~/lib/utils";

export default function Container2xl({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(className, "relative mx-auto max-w-2xl")}>
      {children}
    </div>
  );
}

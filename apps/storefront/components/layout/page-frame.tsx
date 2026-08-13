import type { ReactNode } from "react";

export function PageFrame({ title, children }: { title: string; children: ReactNode }) {
  return <main className="page-frame"><h1>{title}</h1>{children}</main>;
}

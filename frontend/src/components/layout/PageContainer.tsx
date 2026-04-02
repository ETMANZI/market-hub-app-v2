import type { ReactNode } from "react";

export default function PageContainer({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-screen-2xl px-6">{children}</div>;
}
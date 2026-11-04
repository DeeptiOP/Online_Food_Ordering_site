import type { ReactNode } from "react";
import Link from "next/link";
import FlashNotice from "@/components/FlashNotice";

export default function AuthLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <link rel="stylesheet" href="/static/login.css" />
      <header className="auth-header">
        <Link className="auth-brand" href="/">Momo Delights</Link>
      </header>
      <FlashNotice />
      {children}
    </>
  );
}

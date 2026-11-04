import type { ReactNode } from "react";
import SiteHeader from "@/components/SiteHeader";
import FlashNotice from "@/components/FlashNotice";
import { isAdmin } from "@/lib/admin";
import { getSession } from "@/lib/session";

export default async function SiteLayout({ children }: Readonly<{ children: ReactNode }>) {
  const session = await getSession();
  const cartCount = (session.cart ?? []).reduce((count, item) => count + item.quantity, 0);
  const admin = await isAdmin();

  return (
    <>
      <SiteHeader
        username={session.username}
        isAdmin={admin}
        initialCartCount={cartCount}
        resetLegacyCart={Boolean(session.orderConfirmation && cartCount === 0)}
      />
      <FlashNotice />
      {children}
      <footer className="site-footer">
        <div className="container footer-inner"><p>&copy; {new Date().getFullYear()} Momo Delights</p></div>
      </footer>
    </>
  );
}

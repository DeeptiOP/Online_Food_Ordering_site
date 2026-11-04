import type { Metadata } from "next";
import CartClient from "@/components/CartClient";
import { cartTotals, getCartItems } from "@/lib/catalog";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Your Cart | Momo Delights" };

export default async function CartPage() {
  const session = await getSession();
  const items = await getCartItems(session.cart ?? []);

  return (
    <main id="cart-page" className="cart-main">
      <div className="container cart-wrap">
        <h1 className="cart-title">Your cart</h1>
        <CartClient initialItems={items} initialTotals={cartTotals(items)} />
      </div>
    </main>
  );
}

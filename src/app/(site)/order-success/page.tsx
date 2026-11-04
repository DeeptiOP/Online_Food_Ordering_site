import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Order Placed | Momo Delights" };

export default async function OrderSuccessPage() {
  const session = await getSession();
  const order = session.orderConfirmation;
  if (!order) redirect("/menu");

  return (
    <main className="order-success-main">
      <div className="order-success-card">
        <h1>Thank you — your order is placed!</h1>
        <p>We received your order and will start preparing it soon.</p>
        <div className="order-success-summary">
          <h2>Order #{order.order_id}</h2>
          <ul>
            {order.items.map((item) => (
              <li key={item.id}>{item.name} × {item.quantity}<strong>₹{(item.price * item.quantity).toFixed(2)}</strong></li>
            ))}
          </ul>
          <p>Total: <strong>₹{order.total.toFixed(2)}</strong></p>
        </div>
        <Link href="/" className="btn">Back to home</Link>
      </div>
    </main>
  );
}

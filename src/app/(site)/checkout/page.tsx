import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cartTotals, getCartItems } from "@/lib/catalog";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Checkout | Momo Delights" };

export default async function CheckoutPage() {
  const session = await getSession();
  if (!session.userId) {
    redirect("/register?notice=Please%20register%20or%20log%20in%20to%20place%20an%20order&type=warning");
  }
  const items = await getCartItems(session.cart ?? []);
  if (!items.length) redirect("/cart?notice=Your%20cart%20is%20empty&type=warning");
  const totals = cartTotals(items);

  return (
    <main className="cart-main">
      <div className="container cart-wrap">
        <h1 className="profile-title" style={{ textAlign: "center", marginBottom: 45 }}>Checkout</h1>
        <div className="cart-layout">
          <section className="checkout-form">
            <form action="/api/orders" method="post">
              <div className="checkout-card">
                <h2>Shipping details</h2>
                <label htmlFor="checkout-name">Full name</label>
                <input id="checkout-name" name="name" autoComplete="name" required type="text" />
                <label htmlFor="checkout-email">Email</label>
                <input id="checkout-email" name="email" autoComplete="email" required type="email" />
                <label htmlFor="checkout-address">Delivery address</label>
                <textarea id="checkout-address" name="address" autoComplete="street-address" required rows={4} />
                <h3>Payment</h3>
                <label className="payment-option"><input type="radio" name="payment" value="cod" defaultChecked /> Cash on delivery</label>
                <label className="payment-option"><input type="radio" name="payment" value="card" /> Card (mock)</label>
                <button type="submit" className="btn btn-checkout">Place order</button>
              </div>
            </form>
          </section>
          <aside className="cart-summary">
            <h2>Order summary</h2>
            <ul className="checkout-items">
              {items.map((item) => (
                <li key={item.id}><span>{item.name} × {item.quantity}</span><strong>₹{(item.price * item.quantity).toFixed(2)}</strong></li>
              ))}
            </ul>
            <div className="subtotal-row"><span>Subtotal</span><strong>₹{totals.subtotal.toFixed(2)}</strong></div>
            <div className="delivery-row"><span>Delivery</span><strong>₹{totals.delivery_fee.toFixed(2)}</strong></div>
            <div className="total-row"><span>Total</span><strong>₹{totals.total.toFixed(2)}</strong></div>
          </aside>
        </div>
      </div>
    </main>
  );
}

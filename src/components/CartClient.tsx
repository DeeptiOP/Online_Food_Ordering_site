"use client";

import Link from "next/link";
import { useState } from "react";
import type { cartTotals, getCartItems } from "@/lib/catalog";
import { imageUrl } from "@/lib/catalog-images";

type CartItem = Awaited<ReturnType<typeof getCartItems>>[number];
type Totals = ReturnType<typeof cartTotals>;

export default function CartClient({ initialItems, initialTotals }: { initialItems: CartItem[]; initialTotals: Totals }) {
  const [items, setItems] = useState(initialItems);
  const [totals, setTotals] = useState(initialTotals);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [draftQuantities, setDraftQuantities] = useState<Record<string, string>>({});

  async function updateCart(id: string, action: "update" | "remove", quantity?: number) {
    setBusyId(id);
    setError("");
    try {
      const response = await fetch("/api/cart/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, quantity }),
      });
      const result = await response.json();
      if (!response.ok || result.status !== "success") {
        throw new Error(result.message || "Unable to update your cart.");
      }
      setItems(result.cart);
      setTotals(result.totals);
      try {
        localStorage.setItem("cart", JSON.stringify(result.cart));
      } catch (storageError) {
        console.error("Cart updated on the server but could not be cached locally:", storageError);
      }
      setDraftQuantities((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      const count = result.cart.reduce((sum: number, item: CartItem) => sum + item.quantity, 0);
      window.dispatchEvent(new CustomEvent("momo-cart-change", { detail: count }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update your cart.");
    } finally {
      setBusyId("");
    }
  }

  async function clearCart() {
    setError("");
    try {
      const response = await fetch("/api/cart/clear", { method: "POST" });
      if (!response.ok) throw new Error("Unable to clear your cart. Please try again.");
      setItems([]);
      setTotals({ subtotal: 0, delivery_fee: 2, total: 2, free_delivery_remaining: 30 });
      try {
        localStorage.setItem("cart", "[]");
      } catch (storageError) {
        console.error("Cart cleared on the server but local storage could not be updated:", storageError);
      }
      window.dispatchEvent(new CustomEvent("momo-cart-change", { detail: 0 }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to clear your cart.");
    }
  }

  if (!items.length) {
    return (
      <div className="empty-cart">
        <h2>Your cart is empty</h2>
        <p>Browse the menu and add something delicious.</p>
        <Link href="/menu" className="btn btn-checkout">Browse menu</Link>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <ul className="cart-list">
        {items.map((item) => (
          <li className="cart-item" data-id={item.id} key={item.id}>
            <div className="item-image"><img src={imageUrl(item.image)} alt={item.name} /></div>
            <div className="item-details">
              <h2>{item.name}</h2>
              <p className="price">₹{item.price.toFixed(2)} each</p>
            </div>
            <div className="item-controls">
              <div className="quantity-controls" aria-label={`Quantity for ${item.name}`}>
                <button className="quantity-btn minus" type="button" aria-label={`Decrease ${item.name} quantity`} disabled={busyId === item.id || item.quantity <= 1} onClick={() => updateCart(item.id, "update", item.quantity - 1)}>−</button>
                <input className="quantity-input" type="number" min="1" max="99" value={draftQuantities[item.id] ?? item.quantity} aria-label={`${item.name} quantity`} onChange={(event) => setDraftQuantities((current) => ({ ...current, [item.id]: event.target.value }))} onBlur={() => {
                  const quantity = Number(draftQuantities[item.id]);
                  if (Number.isInteger(quantity) && quantity >= 1 && quantity <= 99) {
                    void updateCart(item.id, "update", quantity);
                  } else {
                    setDraftQuantities((current) => {
                      const next = { ...current };
                      delete next[item.id];
                      return next;
                    });
                  }
                }} />
                <button className="quantity-btn plus" type="button" aria-label={`Increase ${item.name} quantity`} disabled={busyId === item.id || item.quantity >= 99} onClick={() => updateCart(item.id, "update", item.quantity + 1)}>+</button>
              </div>
              <strong className="item-total">₹{(item.price * item.quantity).toFixed(2)}</strong>
              <button className="remove-item" type="button" disabled={busyId === item.id} onClick={() => updateCart(item.id, "remove")}>Remove</button>
            </div>
          </li>
        ))}
      </ul>
      <aside className="cart-summary">
        <h2>Order summary</h2>
        <div className="subtotal-row"><span>Subtotal</span><strong className="subtotal-value">₹{totals.subtotal.toFixed(2)}</strong></div>
        <div className="delivery-row"><span>Delivery</span><strong className="delivery-value">₹{totals.delivery_fee.toFixed(2)}</strong></div>
        <div className="total-row"><span>Total</span><strong className="total-value">₹{totals.total.toFixed(2)}</strong></div>
        <p className="free-delivery-note">
          {totals.free_delivery_remaining > 0
            ? `Add ₹${totals.free_delivery_remaining.toFixed(2)} more for free delivery.`
            : "Free delivery applied."}
        </p>
        <div className="cart-actions">
          <button type="button" className="btn btn-clear" onClick={clearCart}>Clear cart</button>
          <Link href="/checkout" className="btn btn-checkout">Continue to checkout</Link>
        </div>
      </aside>
      {error && <p className="cart-error" role="alert">{error}</p>}
    </div>
  );
}

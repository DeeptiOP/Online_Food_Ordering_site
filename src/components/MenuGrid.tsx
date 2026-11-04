"use client";

import { useState } from "react";
import Link from "next/link";
import type { Category, Product } from "@/lib/catalog";
import { imageUrl } from "@/lib/catalog-images";

const redirectProducts = new Set([
  "steamed-veg", "paneer", "cheese-corn", "chicken", "butter-chicken",
  "mushroom-truffle", "thai-chicken", "chilli-veg", "chilli-chicken",
  "jhol-chicken", "kfc-chicken", "schezwan-chicken",
]);

function CartButton({
  product,
  quantity = 1,
  redirectToCart = false,
}: {
  product: Product;
  quantity?: number;
  redirectToCart?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);

  async function addToCart(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id, quantity }),
      });
      const result = await response.json();
      if (!response.ok || result.status !== "success") {
        throw new Error(result.message || "Could not save your cart. Please try again.");
      }
      const count = result.cart.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0);
      try {
        localStorage.setItem("cart", JSON.stringify(result.cart));
      } catch (storageError) {
        console.error("Cart saved on the server but could not be cached locally:", storageError);
      }
      window.dispatchEvent(new CustomEvent("momo-cart-change", { detail: count }));
      setAdded(true);
      window.setTimeout(() => setAdded(false), 2000);
      if (redirectToCart || redirectProducts.has(product.id)) window.location.assign("/cart");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save your cart. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="btn-cart"
        data-id={product.id}
        data-price={product.price}
        onClick={addToCart}
        disabled={busy}
      >
        {busy ? "Adding…" : "Add to Cart"} <i className="fas fa-cart-plus" aria-hidden="true" />
      </button>
      {added && !redirectToCart && !redirectProducts.has(product.id) && <span className="cart-notification" role="status">Added to cart!</span>}
      {error && <span className="cart-action-error" role="alert">{error}</span>}
    </>
  );
}

function MenuCard({ product, vegStyle = false }: { product: Product; vegStyle?: boolean }) {
  const [quantity, setQuantity] = useState(1);
  if (vegStyle) {
    return (
      <li>
        <article className="momo-item">
          <img src={imageUrl(product.image)} alt={product.name} loading="lazy" />
          <span>{product.name}</span>
          <form className="cart" onSubmit={(event) => event.preventDefault()}>
            <label htmlFor={`qty-${product.id}`}>Qty:</label>
            <input id={`qty-${product.id}`} type="number" min="1" max="99" value={quantity} onChange={(event) => {
              const nextQuantity = Number(event.target.value);
              if (Number.isInteger(nextQuantity) && nextQuantity >= 1 && nextQuantity <= 99) setQuantity(nextQuantity);
            }} />
            <CartButton product={product} quantity={quantity} redirectToCart />
          </form>
        </article>
      </li>
    );
  }

  return (
    <article className="menu-item" data-type={product.types.join(" ")}>
      <div className="menu-item-image">
        <img src={imageUrl(product.image)} alt={product.name} loading="lazy" />
      </div>
      <div className="menu-item-content">
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <div className="menu-item-footer">
          <span className="price">₹{product.price}</span>
          <CartButton product={product} />
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({
  products,
  categories = [],
  showFilters = false,
  initialFilters = [],
}: {
  products: Product[];
  categories?: Category[];
  showFilters?: boolean;
  initialFilters?: string[];
}) {
  const [selected, setSelected] = useState<string[]>(initialFilters);
  const filters = [{ key: "all", label: "All Momos" }, ...categories.map(({ id, name }) => ({ key: id, label: name }))];
  const visibleProducts = selected.length
    ? products.filter((product) => selected.some((filter) => product.types.includes(filter)))
    : products;

  function toggleFilter(filter: string) {
    if (filter === "all") {
      setSelected([]);
      return;
    }
    setSelected((current) =>
      current.includes(filter) ? current.filter((value) => value !== filter) : [...current, filter],
    );
  }

  const counts = (filter: string) =>
    filter === "all" ? products.length : products.filter((product) => product.types.includes(filter)).length;

  return (
    <>
      {showFilters && (
        <div className="menu-controls">
          {filters.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={`chip${(key === "all" ? selected.length === 0 : selected.includes(key)) ? " active" : ""}`}
              data-filter={key}
              onClick={() => toggleFilter(key)}
              aria-pressed={key === "all" ? selected.length === 0 : selected.includes(key)}
            >
              <span className="chip-label">{label}</span> <span className="chip-count">({counts(key)})</span>
            </button>
          ))}
        </div>
      )}
      <div className="menu-grid">
        {visibleProducts.map((product) => <MenuCard key={product.id} product={product} />)}
      </div>
      {showFilters && selected.length > 0 && (
        <button className="btn menu-filter-reset" type="button" onClick={() => setSelected([])}>Show all momos</button>
      )}
    </>
  );
}

export function VegProductList({ products }: { products: Product[] }) {
  const [clearError, setClearError] = useState("");
  return (
    <>
      <ul className="momo-list">{products.map((product) => <MenuCard key={product.id} product={product} vegStyle />)}</ul>
      <div className="veg-menu-actions">
        <Link href="/cart" className="btn cart-btn">Go to Cart</Link>
        <button type="button" className="btn cart-btn" onClick={async () => {
          try {
            const response = await fetch("/api/cart/clear", { method: "POST" });
            if (!response.ok) throw new Error("Unable to clear your cart. Please try again.");
            try {
              localStorage.setItem("cart", "[]");
            } catch (storageError) {
              console.error("Cart cleared on the server but local storage could not be updated:", storageError);
            }
            window.dispatchEvent(new CustomEvent("momo-cart-change", { detail: 0 }));
            window.location.assign("/cart");
            setClearError("");
          } catch (caught) {
            setClearError(caught instanceof Error ? caught.message : "Unable to clear your cart.");
          }
        }}>Clear Cart</button>
      </div>
      {clearError && <p className="cart-error" role="alert">{clearError}</p>}
    </>
  );
}

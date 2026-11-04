"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Props = { username?: string; isAdmin?: boolean; initialCartCount: number; resetLegacyCart?: boolean };

export default function SiteHeader({ username, isAdmin = false, initialCartCount, resetLegacyCart = false }: Props) {
  const [cartCount, setCartCount] = useState(initialCartCount);
  const [darkTheme, setDarkTheme] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    let isDark = false;
    try {
      isDark = localStorage.getItem("theme") === "dark";
    } catch (error) {
      console.error("Unable to read the saved theme:", error);
    }
    document.body.classList.toggle("dark-theme", isDark);
    setDarkTheme(isDark);

    const updateCart = (event: Event) => {
      const count = (event as CustomEvent<number>).detail;
      if (typeof count === "number") setCartCount(count);
    };
    window.addEventListener("momo-cart-change", updateCart);
    async function reconcileCartStorage() {
      try {
        if (resetLegacyCart) {
          localStorage.setItem("cart", "[]");
          return;
        }
        const response = await fetch("/api/cart");
        if (!response.ok) throw new Error("Unable to load the saved cart.");
        const current = await response.json();
        if (current.cart.length > 0) {
          localStorage.setItem("cart", JSON.stringify(current.cart));
          const count = current.cart.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0);
          setCartCount(count);
          return;
        }

        const rawSavedCart = localStorage.getItem("cart");
        const savedCart: unknown = rawSavedCart ? JSON.parse(rawSavedCart) : [];
        if (!Array.isArray(savedCart) || savedCart.length === 0) return;
        for (const item of savedCart) {
          if (!item || typeof item.id !== "string" || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) continue;
          const addResponse = await fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: item.id, quantity: item.quantity }),
          });
          if (!addResponse.ok) {
            console.error("Could not restore a saved cart item:", item.id);
            continue;
          }
          const restored = await addResponse.json();
          localStorage.setItem("cart", JSON.stringify(restored.cart));
          const count = restored.cart.reduce((sum: number, entry: { quantity: number }) => sum + entry.quantity, 0);
          setCartCount(count);
        }
      } catch (error) {
        console.error("Unable to restore the saved cart:", error);
      }
    }
    void reconcileCartStorage();
    return () => window.removeEventListener("momo-cart-change", updateCart);
  }, [resetLegacyCart]);

  function toggleTheme() {
    const nextTheme = darkTheme ? "light" : "dark";
    document.body.classList.toggle("dark-theme", nextTheme === "dark");
    try {
      localStorage.setItem("theme", nextTheme);
    } catch (error) {
      console.error("Unable to save the selected theme:", error);
    }
    setDarkTheme(nextTheme === "dark");
  }

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" href="/">
          <h1>Momo Delights</h1>
        </Link>
        <nav id="site-navigation" className={`site-nav${menuOpen ? " open" : ""}`} aria-label="Main navigation">
          <ul>
            <li><Link href="/#home" aria-current={pathname === "/" ? "page" : undefined}>Home</Link></li>
            <li><Link href="/#about">About</Link></li>
            <li><Link href="/menu">Menu</Link></li>
            <li><Link href="/veg_momo">Vegetarian</Link></li>
            <li><Link href="/#contact">Contact</Link></li>
            {isAdmin && <li><Link href="/admin">Admin</Link></li>}
            <li>
              <Link href="/cart" className="cart-link" aria-label={`Cart${cartCount ? `, ${cartCount} items` : ""}`}>
                <i className="fas fa-shopping-cart" aria-hidden="true" />
                <span className="cart-count" hidden={cartCount === 0}>{cartCount}</span>
                <span className="sr-only">Cart</span>
              </Link>
            </li>
            {username ? (
              <>
                <li className="nav-profile"><Link href="/profile"><i className="fas fa-user-circle" aria-hidden="true" /> {username}</Link></li>
                <li><Link href="/logout">Log out</Link></li>
              </>
            ) : (
              <>
                <li><Link href="/login">Log in</Link></li>
                <li><Link href="/register" className="btn-outline">Sign up</Link></li>
              </>
            )}
          </ul>
        </nav>
        <button
          id="theme-toggle"
          className="nav-toggle theme-toggle"
          type="button"
          aria-pressed={darkTheme}
          aria-label={`Switch to ${darkTheme ? "light" : "dark"} theme`}
          title={`Switch to ${darkTheme ? "light" : "dark"} theme`}
          onClick={toggleTheme}
        >
          <span className="sr-only">Switch theme</span>
          <i className={`fas ${darkTheme ? "fa-sun" : "fa-moon"}`} aria-hidden="true" />
        </button>
        <button
          id="nav-toggle"
          className="nav-toggle menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="site-navigation"
          aria-label={`${menuOpen ? "Close" : "Open"} navigation menu`}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="sr-only">Toggle navigation menu</span>
          <i className={`fas ${menuOpen ? "fa-times" : "fa-bars"}`} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}

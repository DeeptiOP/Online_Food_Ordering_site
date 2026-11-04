import { NextResponse } from "next/server";
import { cartTotals, getCartItems } from "@/lib/catalog";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getSession();
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || !("id" in body) || typeof body.id !== "string") {
      return NextResponse.json({ status: "error", message: "Cart item id is required." }, { status: 400 });
    }

    const action = "action" in body ? body.action : "update";
    if (action !== "update" && action !== "remove") {
      return NextResponse.json({ status: "error", message: "Unsupported cart action." }, { status: 400 });
    }

    const cart = session.cart ?? [];
    const item = cart.find((entry) => entry.id === body.id);
    if (!item) {
      return NextResponse.json({ status: "error", message: "Cart item was not found." }, { status: 404 });
    }

    if (action === "remove") {
      session.cart = cart.filter((entry) => entry.id !== body.id);
    } else {
      const quantity = "quantity" in body ? body.quantity : undefined;
      if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        return NextResponse.json({ status: "error", message: "Quantity must be between 1 and 99." }, { status: 400 });
      }
      item.quantity = quantity;
      session.cart = cart;
    }

    await session.save();
    const items = await getCartItems(session.cart);
    return NextResponse.json({ status: "success", cart: items, totals: cartTotals(items) });
  } catch (error) {
    console.error("Could not update cart:", error);
    return NextResponse.json({ status: "error", message: "Could not update your cart. Please try again." }, { status: 500 });
  }
}

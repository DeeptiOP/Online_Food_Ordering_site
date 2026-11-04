import { NextResponse } from "next/server";
import { cartTotals, getCartItems, getProduct } from "@/lib/catalog";
import { getSession } from "@/lib/session";

async function cartResponse(cart: { id: string; quantity: number }[]) {
  const items = await getCartItems(cart);
  return { status: "success", cart: items, totals: cartTotals(items) };
}

export async function GET() {
  const session = await getSession();
  return NextResponse.json(await cartResponse(session.cart ?? []));
}

export async function POST(request: Request) {
  const session = await getSession();
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || !("id" in body) || typeof body.id !== "string") {
      return NextResponse.json({ status: "error", message: "A valid menu item is required." }, { status: 400 });
    }

    const quantity = "quantity" in body ? body.quantity : 1;
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return NextResponse.json({ status: "error", message: "Quantity must be between 1 and 99." }, { status: 400 });
    }
    if (!await getProduct(body.id)) {
      return NextResponse.json({ status: "error", message: "That menu item was not found." }, { status: 404 });
    }

    const cart = session.cart ?? [];
    const existing = cart.find((item) => item.id === body.id);
    if (existing) {
      if (existing.quantity + quantity > 99) {
        return NextResponse.json({ status: "error", message: "Cart item quantity cannot exceed 99." }, { status: 400 });
      }
      existing.quantity += quantity;
    } else {
      cart.push({ id: body.id, quantity });
    }

    session.cart = cart;
    await session.save();
    return NextResponse.json(await cartResponse(cart));
  } catch (error) {
    console.error("Could not add item to cart:", error);
    return NextResponse.json({ status: "error", message: "Could not save your cart. Please try again." }, { status: 500 });
  }
}

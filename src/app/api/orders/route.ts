import { NextResponse } from "next/server";
import { cartTotals, getCartItems } from "@/lib/catalog";
import { getDatabase, ObjectId, type OrderDocument, type UserDocument } from "@/lib/database";
import { getSession } from "@/lib/session";

function checkoutRedirect(request: Request, notice: string, type = "warning") {
  const url = new URL("/checkout", request.url);
  url.searchParams.set("notice", notice);
  url.searchParams.set("type", type);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.userId) {
    const url = new URL("/register", request.url);
    url.searchParams.set("notice", "Please register or log in to place an order.");
    url.searchParams.set("type", "warning");
    return NextResponse.redirect(url, 303);
  }

  const form = await request.formData();
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const address = String(form.get("address") ?? "").trim();
  const payment = String(form.get("payment") ?? "cod");
  if (
    !name ||
    !email ||
    !address ||
    name.length > 255 ||
    address.length > 5000 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    (payment !== "cod" && payment !== "card")
  ) {
    return checkoutRedirect(request, "Enter your name, a valid email address, delivery address and payment method.");
  }

  const cart = session.cart ?? [];
  const items = await getCartItems(cart);
  if (!items.length) return checkoutRedirect(request, "Your cart is empty. Add items before checking out.");
  const total = cartTotals(items).total;

  try {
    const db = await getDatabase();
    const orderItems = items.map(({ id, name: itemName, price, quantity }) => ({
      id,
      name: itemName,
      price,
      quantity,
    }));
    const result = await db.collection<OrderDocument>("orders").insertOne({
      userId: new ObjectId(session.userId),
      name,
      email,
      total,
      address,
      items: orderItems,
      payment,
      status: "pending",
      createdAt: new Date(),
    });
    try {
      await db.collection<UserDocument>("users").updateOne(
        { _id: new ObjectId(session.userId) },
        { $set: { address } },
      );
    } catch (error) {
      console.error("Order was saved, but the user's address could not be updated:", error);
    }

    session.cart = [];
    session.orderConfirmation = {
      order_id: result.insertedId.toHexString(),
      name,
      items: orderItems,
      total,
    };
    await session.save();

    const url = new URL("/order-success", request.url);
    return NextResponse.redirect(url, 303);
  } catch (error) {
    console.error("Order persistence failed:", error);
    return checkoutRedirect(request, "We could not save your order. Your cart is still available; please try again later.", "danger");
  }
}

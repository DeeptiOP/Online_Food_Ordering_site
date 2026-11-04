import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getSession();
  session.cart = [];
  await session.save();
  if (request.headers.get("accept")?.includes("text/html")) {
    return NextResponse.redirect(new URL("/cart", request.url), 303);
  }
  return NextResponse.json({ status: "success", cart: [] });
}

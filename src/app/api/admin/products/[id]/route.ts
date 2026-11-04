import { NextResponse } from "next/server";
import { adminApiGuard } from "@/lib/admin-api";
import { getDatabase, type ProductDocument } from "@/lib/database";
import { isSafeImage, isSlug } from "@/lib/admin-api";

function parseProductUpdate(value: unknown): Pick<ProductDocument, "name" | "description" | "image" | "price" | "types" | "vegMenu"> | null {
  if (!value || typeof value !== "object") return null;
  const body = value as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const image = typeof body.image === "string" ? body.image.trim() : "";
  const price = body.price;
  const types = body.types;
  if (
    !name ||
    name.length > 120 ||
    description.length > 1000 ||
    !isSafeImage(image) ||
    typeof price !== "number" ||
    !Number.isFinite(price) ||
    price < 0 ||
    price > 1000000 ||
    !Array.isArray(types) ||
    types.length < 1 ||
    types.length > 20 ||
    !types.every(isSlug) ||
    new Set(types).size !== types.length ||
    typeof body.vegMenu !== "boolean"
  ) return null;

  return {
    name,
    description,
    image,
    price,
    types,
    ...(body.vegMenu ? { vegMenu: true } : {}),
  };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminApiGuard();
  if (denied) return denied;
  const { id } = await params;
  if (!isSlug(id)) return NextResponse.json({ error: "Invalid product ID." }, { status: 400 });

  try {
    const update = parseProductUpdate(await request.json());
    if (!update) return NextResponse.json({ error: "Enter valid product details and at least one category." }, { status: 400 });
    const db = await getDatabase();
    const categoryCount = await db.collection("categories").countDocuments({ id: { $in: update.types } });
    if (categoryCount !== update.types.length) {
      return NextResponse.json({ error: "Choose only existing categories." }, { status: 400 });
    }
    const result = await db.collection<ProductDocument>("products").updateOne({ id }, { $set: update });
    if (!result.matchedCount) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Could not update product:", error);
    return NextResponse.json({ error: "Could not update product." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminApiGuard();
  if (denied) return denied;
  const { id } = await params;
  if (!isSlug(id)) return NextResponse.json({ error: "Invalid product ID." }, { status: 400 });
  try {
    const db = await getDatabase();
    const result = await db.collection<ProductDocument>("products").deleteOne({ id });
    if (!result.deletedCount) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Could not delete product:", error);
    return NextResponse.json({ error: "Could not delete product." }, { status: 500 });
  }
}

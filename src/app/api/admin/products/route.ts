import { NextResponse } from "next/server";
import { adminApiGuard, isSafeImage, isSlug } from "@/lib/admin-api";
import { getDatabase, type CategoryDocument, type ProductDocument } from "@/lib/database";

function parseProduct(value: unknown): ProductDocument | null {
  if (!value || typeof value !== "object") return null;
  const body = value as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const image = typeof body.image === "string" ? body.image.trim() : "";
  const price = body.price;
  const types = body.types;
  if (
    !isSlug(body.id) ||
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
    (body.vegMenu !== undefined && typeof body.vegMenu !== "boolean")
  ) return null;

  return {
    id: body.id,
    name,
    description,
    image,
    price,
    types,
    ...(body.vegMenu === true ? { vegMenu: true } : {}),
  };
}

export async function GET() {
  const denied = await adminApiGuard();
  if (denied) return denied;
  try {
    const db = await getDatabase();
    const products = await db.collection<ProductDocument>("products").find().sort({ name: 1 }).toArray();
    return NextResponse.json({ products });
  } catch (error) {
    console.error("Could not load admin products:", error);
    return NextResponse.json({ error: "Could not load products." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await adminApiGuard();
  if (denied) return denied;
  try {
    const input = parseProduct(await request.json());
    if (!input) return NextResponse.json({ error: "Enter a valid product name, image, price and at least one category." }, { status: 400 });

    const db = await getDatabase();
    const categoryCount = await db.collection<CategoryDocument>("categories").countDocuments({ id: { $in: input.types } });
    if (categoryCount !== input.types.length) {
      return NextResponse.json({ error: "Choose only existing categories." }, { status: 400 });
    }

    await db.collection<ProductDocument>("products").insertOne(input);
    return NextResponse.json({ status: "success", product: input }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
      return NextResponse.json({ error: "A product with that ID already exists." }, { status: 409 });
    }
    console.error("Could not create product:", error);
    return NextResponse.json({ error: "Could not create product." }, { status: 500 });
  }
}

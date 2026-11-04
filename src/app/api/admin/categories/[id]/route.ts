import { NextResponse } from "next/server";
import { adminApiGuard, isSlug } from "@/lib/admin-api";
import { getDatabase, type CategoryDocument, type ProductDocument } from "@/lib/database";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminApiGuard();
  if (denied) return denied;
  const { id } = await params;
  if (!isSlug(id)) return NextResponse.json({ error: "Invalid category ID." }, { status: 400 });
  try {
    const body: unknown = await request.json();
    const name = body && typeof body === "object" && "name" in body && typeof body.name === "string"
      ? body.name.trim()
      : "";
    if (!name || name.length > 80) return NextResponse.json({ error: "Enter a category name up to 80 characters." }, { status: 400 });
    const db = await getDatabase();
    const result = await db.collection<CategoryDocument>("categories").updateOne({ id }, { $set: { name } });
    if (!result.matchedCount) return NextResponse.json({ error: "Category not found." }, { status: 404 });
    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Could not update category:", error);
    return NextResponse.json({ error: "Could not update category." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminApiGuard();
  if (denied) return denied;
  const { id } = await params;
  if (!isSlug(id)) return NextResponse.json({ error: "Invalid category ID." }, { status: 400 });
  try {
    const db = await getDatabase();
    const products = db.collection<ProductDocument>("products");
    if (await products.countDocuments({ types: id })) {
      return NextResponse.json({ error: "Remove this category from its products before deleting it." }, { status: 409 });
    }
    const result = await db.collection<CategoryDocument>("categories").deleteOne({ id });
    if (!result.deletedCount) return NextResponse.json({ error: "Category not found." }, { status: 404 });
    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Could not delete category:", error);
    return NextResponse.json({ error: "Could not delete category." }, { status: 500 });
  }
}

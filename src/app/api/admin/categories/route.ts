import { NextResponse } from "next/server";
import { adminApiGuard, isSlug } from "@/lib/admin-api";
import { getDatabase, type CategoryDocument } from "@/lib/database";

export async function GET() {
  const denied = await adminApiGuard();
  if (denied) return denied;
  try {
    const db = await getDatabase();
    const categories = await db.collection<CategoryDocument>("categories").find().sort({ name: 1 }).toArray();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Could not load admin categories:", error);
    return NextResponse.json({ error: "Could not load categories." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await adminApiGuard();
  if (denied) return denied;
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Enter a category name." }, { status: 400 });
    const { id, name } = body as Record<string, unknown>;
    if (!isSlug(id) || typeof name !== "string" || !name.trim() || name.trim().length > 80) {
      return NextResponse.json({ error: "Enter a valid category name and ID." }, { status: 400 });
    }
    const db = await getDatabase();
    await db.collection<CategoryDocument>("categories").insertOne({ id, name: name.trim() });
    return NextResponse.json({ status: "success" }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
      return NextResponse.json({ error: "A category with that ID already exists." }, { status: 409 });
    }
    console.error("Could not create category:", error);
    return NextResponse.json({ error: "Could not create category." }, { status: 500 });
  }
}

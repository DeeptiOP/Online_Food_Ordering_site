import { NextResponse } from "next/server";
import { getDatabase, ObjectId, type UserDocument } from "@/lib/database";
import { getSession } from "@/lib/session";

export async function adminApiGuard(): Promise<NextResponse | null> {
  const session = await getSession();
  if (!session.userId || !ObjectId.isValid(session.userId)) {
    return NextResponse.json({ error: "Please log in to continue." }, { status: 401 });
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail) {
    return NextResponse.json({ error: "Admin access is not configured." }, { status: 403 });
  }

  const db = await getDatabase();
  const user = await db.collection<UserDocument>("users").findOne({
    _id: new ObjectId(session.userId),
    emailNormalized: adminEmail,
  }, { projection: { _id: 1 } });
  if (!user) return NextResponse.json({ error: "Admin access is required." }, { status: 403 });
  return null;
}

export function isSlug(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 80;
}

export function isSafeImage(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 1000) return false;
  if (/^https:\/\//i.test(value)) return true;
  return /^(?:\/static\/)?[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(value) && !value.includes("..");
}

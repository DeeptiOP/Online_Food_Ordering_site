import { getDatabase, ObjectId, type UserDocument } from "@/lib/database";
import { getSession } from "@/lib/session";

export async function isAdmin(): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail) return false;

  const session = await getSession();
  if (!session.userId || !ObjectId.isValid(session.userId)) return false;

  const db = await getDatabase();
  const user = await db.collection<UserDocument>("users").findOne({
    _id: new ObjectId(session.userId),
    emailNormalized: adminEmail,
  }, { projection: { _id: 1 } });
  return user !== null;
}

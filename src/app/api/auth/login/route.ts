import { NextResponse } from "next/server";
import { getDatabase, type UserDocument } from "@/lib/database";
import { hashPassword, verifyPassword } from "@/lib/password";
import { getSession } from "@/lib/session";

function goTo(request: Request, path: string, notice: string, type = "warning") {
  const url = new URL(path, request.url);
  url.searchParams.set("notice", notice);
  url.searchParams.set("type", type);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (session.userId) return goTo(request, "/profile", "You are already logged in.", "info");

  const form = await request.formData();
  const identifier = String(form.get("username") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!identifier || !password || identifier.length > 255 || password.length > 1024) {
    return goTo(request, "/login", "Username/email and password are required.");
  }

  try {
    const db = await getDatabase();
    const users = db.collection<UserDocument>("users");
    const normalizedIdentifier = identifier.toLowerCase();
    const [usernameUser, emailUser] = await Promise.all([
      users.findOne({ usernameNormalized: normalizedIdentifier }),
      users.findOne({ emailNormalized: normalizedIdentifier }),
    ]);
    const isAmbiguous = usernameUser && emailUser &&
      String(usernameUser._id) !== String(emailUser._id);
    const user = isAmbiguous ? null : usernameUser ?? emailUser;
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return goTo(request, "/login", "Invalid username or password.", "danger");
    }

    if (!user.passwordHash.includes("$")) {
      await db.collection<UserDocument>("users").updateOne(
        { _id: user._id },
        { $set: { passwordHash: hashPassword(password) } },
      );
    }
    session.userId = user._id.toHexString();
    session.username = user.username;
    await session.save();
    return goTo(request, "/", "Logged in successfully.", "success");
  } catch (error) {
    console.error("Login failed:", error);
    return goTo(request, "/login", "Login could not be completed. Please try again later.", "danger");
  }
}

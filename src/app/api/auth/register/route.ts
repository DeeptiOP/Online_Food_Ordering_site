import { NextResponse } from "next/server";
import { getDatabase, type UserDocument } from "@/lib/database";
import { hashPassword } from "@/lib/password";
import { getSession } from "@/lib/session";

function goTo(request: Request, path: string, notice: string, type = "warning") {
  const url = new URL(path, request.url);
  url.searchParams.set("notice", notice);
  url.searchParams.set("type", type);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (session.userId) return goTo(request, "/profile", "You are already registered and logged in.", "info");

  const form = await request.formData();
  const username = String(form.get("username") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!username || !email || !password) {
    return goTo(request, "/register", "Username, email and password are required.");
  }
  if (
    username.length > 80 ||
    email.length > 255 ||
    password.length < 8 ||
    password.length > 1024 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return goTo(request, "/register", "Enter a valid username, email address and password.");
  }

  try {
    const db = await getDatabase();
    const users = db.collection<UserDocument>("users");
    const usernameNormalized = username.toLowerCase();
    const emailNormalized = email.toLowerCase();
    const existing = await users.findOne({
      $or: [{ usernameNormalized }, { emailNormalized }],
    }, { projection: { _id: 1 } });
    if (existing) {
      return goTo(request, "/register", "Username or email already exists.");
    }
    await users.insertOne({
      username,
      usernameNormalized,
      email,
      emailNormalized,
      passwordHash: hashPassword(password),
      address: null,
      createdAt: new Date(),
    });
    return goTo(request, "/login", "Registration successful. Please log in.", "success");
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
      return goTo(request, "/register", "Username or email already exists.");
    }
    console.error("Registration failed:", error);
    return goTo(request, "/register", "Registration could not be completed. Please try again later.", "danger");
  }
}

import { getIronSession, type SessionOptions } from "iron-session";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";

export type CartEntry = { id: string; quantity: number };
export type OrderConfirmation = {
  order_id: string;
  name: string;
  items: Array<{ id: string; name: string; price: number; quantity: number }>;
  total: number;
};

export type SessionData = {
  userId?: string;
  username?: string;
  cart?: CartEntry[];
  profileAddress?: string;
  orderConfirmation?: OrderConfirmation;
};

function getSessionOptions(): SessionOptions {
  const password = process.env.SESSION_SECRET ?? process.env.SECRET_KEY;
  if (process.env.NODE_ENV === "production" && (!password || password.length < 32)) {
    throw new Error("Set SESSION_SECRET to a random value of at least 32 characters.");
  }

  return {
    cookieName: "momo_session",
    password: password && password.length >= 32 ? password : "local-development-secret-change-before-deploy-32",
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    },
  };
}

export async function getSession() {
  const session = await getIronSession<SessionData>(await cookies(), getSessionOptions());
  if (session.userId !== undefined && (typeof session.userId !== "string" || !ObjectId.isValid(session.userId))) {
    delete session.userId;
    delete session.username;
    await session.save();
  }
  return session;
}

import { NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/database";

export async function POST(request: Request) {
  const setupToken = process.env.INIT_DB_TOKEN;
  const authorization = request.headers.get("authorization");
  if (
    process.env.INIT_DB !== "true" ||
    !setupToken ||
    authorization !== `Bearer ${setupToken}`
  ) {
    return NextResponse.json({ error: "Database initialization is disabled or unauthorized." }, { status: 403 });
  }

  try {
    await initializeDatabase();
    return NextResponse.json({ status: "success", message: "MongoDB is connected and its indexes are ready." });
  } catch (error) {
    console.error("Database initialization failed:", error);
    return NextResponse.json({ status: "error", message: "Database initialization failed." }, { status: 500 });
  }
}

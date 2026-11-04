import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET(request: Request) {
  const session = await getSession();
  session.destroy();
  const url = new URL("/", request.url);
  url.searchParams.set("notice", "You have been logged out.");
  url.searchParams.set("type", "info");
  return NextResponse.redirect(url);
}

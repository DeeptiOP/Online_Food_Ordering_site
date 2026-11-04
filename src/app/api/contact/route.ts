import { NextResponse } from "next/server";
import { getDatabase, type ContactDocument } from "@/lib/database";

export async function POST(request: Request) {
  const form = await request.formData();
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const subject = String(form.get("subject") ?? "").trim();
  const message = String(form.get("message") ?? "").trim();
  const url = new URL("/", request.url);
  url.hash = "contact";

  if (!name || !email || !subject || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    url.searchParams.set("notice", "Enter your name, a valid email, subject and message.");
    url.searchParams.set("type", "warning");
    return NextResponse.redirect(url, 303);
  }

  try {
    const db = await getDatabase();
    await db.collection<ContactDocument>("contacts").insertOne({
      name,
      email,
      subject,
      message,
      createdAt: new Date(),
    });
    url.searchParams.set("notice", "Thank you for your message! We will get back to you soon.");
    url.searchParams.set("type", "success");
  } catch (error) {
    console.error("Contact form submission failed:", error);
    url.searchParams.set("notice", "Your message could not be sent. Please try again.");
    url.searchParams.set("type", "danger");
  }
  return NextResponse.redirect(url, 303);
}

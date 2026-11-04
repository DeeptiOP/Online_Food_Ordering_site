import { NextResponse } from "next/server";
import { getDatabase, ObjectId, type UserDocument } from "@/lib/database";
import { getSession } from "@/lib/session";

function profileRedirect(request: Request, notice: string, type = "warning") {
  const url = new URL("/profile", request.url);
  url.searchParams.set("notice", notice);
  url.searchParams.set("type", type);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.userId) return profileRedirect(request, "Please log in to manage your profile.");

  const form = await request.formData();
  const line1 = String(form.get("line1") ?? "").trim();
  const line2 = String(form.get("line2") ?? "").trim();
  const city = String(form.get("city") ?? "").trim();
  const state = String(form.get("state") ?? "").trim();
  const zipcode = String(form.get("zipcode") ?? "").trim();
  const phone = String(form.get("phone") ?? "").trim();
  if (!line1 || !city || !phone) {
    return profileRedirect(request, "Please provide at least address line 1, city and phone number.");
  }

  const address = `${line1}${line2 ? `\n${line2}` : ""}\n${city}, ${state} - ${zipcode}\nPhone: ${phone}`;
  try {
    const db = await getDatabase();
    const result = await db.collection<UserDocument>("users").updateOne(
      { _id: new ObjectId(session.userId) },
      { $set: { address } },
    );
    if (result.matchedCount === 0) {
      session.destroy();
      return profileRedirect(request, "Please log in to manage your profile.");
    }
    session.profileAddress = address;
    await session.save();
    return profileRedirect(request, "Address saved to your profile.", "success");
  } catch (error) {
    console.error("Could not save profile address:", error);
    return profileRedirect(request, "Address could not be saved. Please try again later.", "danger");
  }
}

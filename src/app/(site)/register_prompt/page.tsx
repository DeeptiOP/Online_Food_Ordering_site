import { redirect } from "next/navigation";

export default function RegisterPromptPage() {
  redirect("/register?notice=Please%20register%20or%20log%20in%20to%20place%20an%20order&type=info");
}

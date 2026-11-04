import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Create an account | Momo Delights" };

export default async function RegisterPage() {
  const session = await getSession();
  if (session.userId) redirect("/profile");

  return (
    <main className="auth-main">
      <section className="auth-intro" aria-labelledby="auth-heading">
        <p className="auth-eyebrow">Your next favorite bite awaits</p>
        <h1 id="auth-heading">A table for you.</h1>
        <p>Create an account to order your favorites and keep your Momo Delights experience close.</p>
      </section>
      <section className="auth-card" aria-labelledby="form-heading">
        <h2 id="form-heading">Create your account</h2>
        <p className="auth-subtitle">It only takes a moment to get started.</p>
        <form className="auth-form" action="/api/auth/register" method="post">
          <div className="auth-field"><label htmlFor="username">Username</label><input type="text" id="username" name="username" autoComplete="username" placeholder="Choose a username" required /></div>
          <div className="auth-field"><label htmlFor="email">Email address</label><input type="email" id="email" name="email" autoComplete="email" placeholder="you@example.com" required /></div>
          <div className="auth-field"><label htmlFor="password">Password</label><input type="password" id="password" name="password" autoComplete="new-password" placeholder="Create a password" minLength={8} maxLength={1024} required /></div>
          <button className="auth-submit" type="submit">Create account</button>
        </form>
        <p className="auth-switch">Already have an account? <a href="/login">Log in</a></p>
      </section>
    </main>
  );
}

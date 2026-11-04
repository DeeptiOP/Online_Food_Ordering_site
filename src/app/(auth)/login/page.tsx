import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Log in | Momo Delights" };

export default async function LoginPage() {
  const session = await getSession();
  if (session.userId) redirect("/profile");

  return (
    <main className="auth-main">
      <section className="auth-intro" aria-labelledby="auth-heading">
        <p className="auth-eyebrow">Good food, just a sign in away</p>
        <h1 id="auth-heading">Welcome back.</h1>
        <p>Sign in to pick up where you left off and enjoy your favorite momos.</p>
      </section>
      <section className="auth-card" aria-labelledby="form-heading">
        <h2 id="form-heading">Log in</h2>
        <p className="auth-subtitle">Enter your details to continue.</p>
        <form className="auth-form" action="/api/auth/login" method="post">
          <div className="auth-field"><label htmlFor="username">Username or email</label><input type="text" id="username" name="username" autoComplete="username" placeholder="Your username or email" required /></div>
          <div className="auth-field"><label htmlFor="password">Password</label><input type="password" id="password" name="password" autoComplete="current-password" placeholder="Your password" required /></div>
          <button className="auth-submit" type="submit">Log in</button>
        </form>
        <p className="auth-switch">New to Momo Delights? <a href="/register">Create an account</a></p>
      </section>
    </main>
  );
}

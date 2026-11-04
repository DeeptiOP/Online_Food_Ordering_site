import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./app.css";

export const metadata: Metadata = {
  title: "Momo Delights",
  description: "Handcrafted momos, made with love.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Source+Sans+3:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
        <link rel="stylesheet" href="/static/style.css" />
        <link rel="stylesheet" href="/static/cart.css" />
        <link rel="stylesheet" href="/static/veg_momo.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}

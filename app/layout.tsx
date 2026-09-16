import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ANDAZZ — Wear Your Story",
  description: "ANDAZZ — Gen-Z streetwear. Oversized tees, hoodies, sweatshirts and cargos.",
  icons: {
    icon: [
      { url: "/favicon.svg?v=2", type: "image/svg+xml" },
      { url: "/favicon-32.png?v=2", type: "image/png", sizes: "32x32" },
    ],
    shortcut: "/favicon.ico?v=2",
    apple: { url: "/apple-touch-icon.png?v=2", sizes: "180x180" },
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}

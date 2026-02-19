import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Voice Cooking — Lemon Garlic Butter Shrimp",
  description: "A voice-guided cooking experience powered by ElevenLabs",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="noise-bg">{children}</body>
    </html>
  );
}

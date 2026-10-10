import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spider Uncopylocked | Creator Resources",
  description: "A creator-focused hub for Roblox development resources, games, and community.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import "./premium-surfaces.css";
import "./workspace-enhancements.css";
import AppConvexProvider from "./convex-provider";

export const metadata: Metadata = {
  title: "Spider Uncopylocked | Creator Resources",
  description: "A creator-focused hub for Roblox development resources, games, and community.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><AppConvexProvider>{children}</AppConvexProvider></body>
    </html>
  );
}

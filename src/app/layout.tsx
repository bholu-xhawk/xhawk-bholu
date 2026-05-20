import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Next.js 14 Landing Page",
  description: "A simple landing page built with Next.js 14 and Tailwind CSS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}

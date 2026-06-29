import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Barangay Digital Service Platform",
  description: "SaaS-ready digital citizen service platform for Philippine barangays.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

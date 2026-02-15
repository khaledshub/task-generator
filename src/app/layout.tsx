import type { Metadata } from "next";
import { AppProviders } from "@/components/app-providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "TodoList RandomGenerator",
  description:
    "A weighted-random task picker to help you start the right next action.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

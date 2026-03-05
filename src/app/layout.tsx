import type { Metadata } from "next";
import Script from "next/script";
import { cookies } from "next/headers";
import { AppProviders } from "@/components/app-providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "TodoList RandomGenerator",
  description:
    "A weighted-random task picker to help you start the right next action.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const cookieThemeMode = cookieStore.get("taskgen-theme-mode")?.value;
  const initialMode = cookieThemeMode === "light" || cookieThemeMode === "dark"
    ? cookieThemeMode
    : "dark";

  return (
    <html lang="en" data-theme={initialMode} suppressHydrationWarning>
      <head>
        <Script
          id="taskgen-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem("taskgen-theme-mode");
                  var mode = stored === "light" || stored === "dark"
                    ? stored
                    : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
                  document.documentElement.dataset.theme = mode;
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <AppProviders initialMode={initialMode}>{children}</AppProviders>
      </body>
    </html>
  );
}

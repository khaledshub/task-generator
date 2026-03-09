"use client";

import { AppBar, Box, Button, Toolbar } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Home", match: (pathname: string) => pathname === "/" },
  { href: "/login", label: "Log in", match: (pathname: string) => pathname === "/login" },
  { href: "/signup", label: "Sign up", match: (pathname: string) => pathname === "/signup" },
];

/**
 * Renders the top navigation banner used on public (unauthenticated) pages.
 */
export function PublicHeader() {
  const pathname = usePathname();
  const router = useRouter();

  function toCanonicalPath(path: string): string {
    const collapsed = path.replace(/\/{2,}/g, "/");
    if (collapsed.length > 1 && collapsed.endsWith("/")) {
      return collapsed.slice(0, -1);
    }
    return collapsed;
  }

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{
        bgcolor: "transparent",
        border: "none",
        boxShadow: "none",
        px: { xs: 0.5, sm: 1.5, md: 2 },
        pt: { xs: 0.5, sm: 1 },
      }}
    >
      <Box
        sx={{
          width: { xs: "100%", lg: "75%" },
          mx: "auto",
          p: "2px",
          borderRadius: 4,
          border: "1px solid",
          borderColor:
            "color-mix(in srgb, var(--mui-palette-primary-main) 22%, transparent)",
          bgcolor:
            "color-mix(in srgb, var(--mui-palette-background-default) 68%, white 32%)",
          backgroundImage:
            "linear-gradient(165deg, color-mix(in srgb, var(--mui-palette-primary-main) 18%, transparent) 0%, color-mix(in srgb, var(--mui-palette-background-paper) 82%, transparent) 42%, color-mix(in srgb, var(--mui-palette-secondary-main) 14%, transparent) 100%)",
          backdropFilter: "blur(14px)",
          boxShadow:
            "0 14px 30px color-mix(in srgb, var(--mui-palette-primary-main) 16%, transparent), 0 3px 10px color-mix(in srgb, black 14%, transparent), inset 0 1px 0 color-mix(in srgb, white 40%, transparent), inset 0 -1px 0 color-mix(in srgb, black 18%, transparent)",
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: "\"\"",
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, color-mix(in srgb, white 22%, transparent) 0%, transparent 42%)",
            pointerEvents: "none",
          },
          "&::after": {
            content: "\"\"",
            position: "absolute",
            left: "2%",
            right: "2%",
            bottom: 0,
            height: 1,
            background:
              "linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--mui-palette-primary-main) 44%, transparent) 50%, transparent 100%)",
            pointerEvents: "none",
          },
        }}
      >
        <Toolbar
          sx={{
            gap: { xs: 0.5, sm: 1 },
            justifyContent: "center",
            py: { xs: 0.4, sm: 0.8 },
            minHeight: { xs: "44px !important", sm: "58px !important" },
            px: { xs: 0.8, sm: 1.5 },
          }}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = item.match(pathname);
            return (
              <Button
                key={item.href}
                aria-current={isActive ? "page" : undefined}
                size="small"
                variant={isActive ? "contained" : "outlined"}
                color={isActive ? "primary" : "inherit"}
                onClick={() => router.push(toCanonicalPath(item.href))}
                sx={{
                  borderRadius: 999,
                  fontSize: { xs: "0.72rem", sm: "0.84rem" },
                  py: { xs: 0.35, sm: 0.62 },
                  px: { xs: 1.15, sm: 1.55 },
                  minHeight: { xs: 28, sm: 34 },
                  lineHeight: 1.1,
                }}
              >
                {item.label}
              </Button>
            );
          })}
        </Toolbar>
      </Box>
    </AppBar>
  );
}

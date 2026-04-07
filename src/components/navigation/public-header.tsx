"use client";

import { AutoAwesomeRounded } from "@mui/icons-material";
import { Box, Button, Stack, Toolbar, Typography } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";
import { HeaderFrame } from "@/components/navigation/header-frame";
import { getInteractiveFocusSx } from "@/theme/patterns";

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
    <HeaderFrame>
      <Toolbar
        sx={{
          gap: { xs: 1, sm: 2 },
          justifyContent: "space-between",
          py: { xs: 0.65, sm: 0.95 },
          minHeight: { xs: "56px !important", sm: "68px !important" },
          px: { xs: 1.2, sm: 1.75 },
        }}
      >
        <Stack
          direction="row"
          spacing={1.25}
          alignItems="center"
          sx={{ minWidth: 0, cursor: "pointer" }}
          onClick={() => router.push("/")}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              background: "linear-gradient(135deg, rgba(173,198,255,0.26), rgba(76,215,246,0.18))",
              color: "secondary.main",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <AutoAwesomeRounded sx={{ fontSize: 20 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 800,
                letterSpacing: "-0.04em",
                lineHeight: 1,
              }}
            >
              Task Generator
            </Typography>
            <Typography sx={{ color: "text.secondary", fontSize: "0.72rem", lineHeight: 1.1 }}>
              Celestial Navigator
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap" justifyContent="flex-end">
          {NAV_ITEMS.map((item) => {
            const isActive = item.match(pathname);
            return (
              <Button
                key={item.href}
                aria-current={isActive ? "page" : undefined}
                size="small"
                variant={isActive ? "contained" : "text"}
                color={isActive ? "primary" : "inherit"}
                onClick={() => router.push(toCanonicalPath(item.href))}
                sx={(theme) => ({
                  ...getInteractiveFocusSx(theme),
                  borderRadius: theme.app.radius.pill,
                  fontSize: { xs: "0.74rem", sm: "0.86rem" },
                  py: { xs: 0.4, sm: 0.72 },
                  px: { xs: 1.2, sm: 1.65 },
                  minHeight: { xs: 30, sm: 36 },
                  lineHeight: 1.1,
                  color: isActive ? undefined : "text.secondary",
                })}
              >
                {item.label}
              </Button>
            );
          })}
        </Stack>
      </Toolbar>
    </HeaderFrame>
  );
}

"use client";

import { AppBar, Box, Button, Stack, Toolbar, Typography } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogoutButton } from "@/components/logout-button";

interface AppHeaderProps {
  userEmail?: string | null;
}

const NAV_ITEMS = [
  { href: "/app", label: "Home", match: (pathname: string) => pathname === "/app" },
  {
    href: "/app/tasks",
    label: "Tasks",
    match: (pathname: string) => pathname.startsWith("/app/tasks"),
  },
  { href: "/app/pick", label: "Pick", match: (pathname: string) => pathname.startsWith("/app/pick") },
  {
    href: "/app/history",
    label: "History",
    match: (pathname: string) => pathname.startsWith("/app/history"),
  },
];

export function AppHeader({ userEmail }: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollYRef = useRef(0);

  function toCanonicalPath(path: string): string {
    const collapsed = path.replace(/\/{2,}/g, "/");
    if (collapsed.length > 1 && collapsed.endsWith("/")) {
      return collapsed.slice(0, -1);
    }
    return collapsed;
  }

  useEffect(() => {
    function handleScroll() {
      const currentY = window.scrollY;
      const lastY = lastScrollYRef.current;

      if (currentY < 24) {
        setIsVisible(true);
      } else if (currentY > lastY + 8) {
        setIsVisible(false);
      } else if (currentY < lastY - 8) {
        setIsVisible(true);
      }

      lastScrollYRef.current = currentY;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
        transition: "transform 220ms ease, opacity 220ms ease",
        transform: isVisible ? "translateY(0)" : "translateY(-130%)",
        opacity: isVisible ? 1 : 0,
      }}
    >
      <Box
        sx={{
          width: { xs: "100%", lg: "75%" },
          mx: "auto",
          borderRadius: 4,
          border: "1px solid",
          borderColor:
            "color-mix(in srgb, var(--mui-palette-primary-main) 22%, transparent)",
          bgcolor:
            "color-mix(in srgb, var(--mui-palette-background-paper) 78%, transparent)",
          backdropFilter: "blur(14px)",
          boxShadow:
            "0 10px 24px color-mix(in srgb, var(--mui-palette-primary-main) 14%, transparent)",
        }}
      >
        <Toolbar
          sx={{
            gap: { xs: 0.6, sm: 1.25 },
            alignItems: "center",
            py: { xs: 0.45, sm: 1 },
            minHeight: { xs: "46px !important", sm: "64px !important" },
            px: { xs: 1, sm: 2 },
          }}
        >
          <Box sx={{ flexGrow: 1 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(4, minmax(0, 1fr))" },
                gap: { xs: 0.55, sm: 1 },
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
                  onClick={() => {
                    router.push(toCanonicalPath(item.href));
                  }}
                  sx={{
                    width: "100%",
                    borderRadius: 999,
                    fontSize: { xs: "0.62rem", sm: "0.8rem" },
                    py: { xs: 0.22, sm: 0.65 },
                    px: { xs: 0.5, sm: 1.1 },
                    minHeight: { xs: 26, sm: 36 },
                    lineHeight: 1.1,
                  }}
                >
                  {item.label}
                </Button>
                );
              })}
            </Box>
          </Box>

          <Stack spacing={{ xs: 0.25, sm: 0.45 }} alignItems="flex-end" sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              color="text.primary"
              noWrap
              sx={{
                maxWidth: { xs: 130, sm: 190, md: 240 },
                px: 1,
                py: 0.35,
                borderRadius: 999,
                border: "1px solid",
                borderColor:
                  "color-mix(in srgb, var(--mui-palette-primary-main) 26%, transparent)",
                background:
                  "color-mix(in srgb, var(--mui-palette-primary-main) 10%, transparent)",
                fontWeight: 600,
                fontSize: { xs: "0.65rem", sm: "0.72rem" },
                display: { xs: "none", sm: "block" },
              }}
              title={userEmail ?? undefined}
            >
              {userEmail}
            </Typography>
            <LogoutButton />
          </Stack>
        </Toolbar>
      </Box>
    </AppBar>
  );
}

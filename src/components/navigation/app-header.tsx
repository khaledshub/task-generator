"use client";

import { AppBar, Box, Button, Stack, Toolbar } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogoutButton } from "@/components/logout-button";

interface AppHeaderProps {
  userEmail?: string | null;
  isGuest?: boolean;
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

export function AppHeader({ userEmail, isGuest = false }: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const displayUserName = isGuest ? "Guest" : (userEmail?.split("@")[0] ?? "");
  const userActionButtonSx = {
    width: { xs: 96, sm: 132 },
    fontSize: { xs: "0.62rem", sm: "0.78rem" },
    minHeight: { xs: 24, sm: 34 },
    px: { xs: 0.7, sm: 1.2 },
    py: { xs: 0.2, sm: 0.55 },
    lineHeight: 1.1,
    borderRadius: 999,
  } as const;

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

          <Stack spacing={{ xs: 0.4, sm: 0.6 }} alignItems="flex-end" sx={{ minWidth: 0 }}>
            <Button
              color="inherit"
              variant="outlined"
              size="small"
              onClick={() => router.push(toCanonicalPath("/app/user"))}
              sx={{
                border: "1px solid",
                borderColor:
                  "color-mix(in srgb, var(--mui-palette-primary-main) 26%, transparent)",
                background:
                  "color-mix(in srgb, var(--mui-palette-primary-main) 10%, transparent)",
                fontWeight: 700,
                display: { xs: "none", sm: "block" },
                transition: "transform 140ms ease, box-shadow 140ms ease",
                "&:hover": {
                  transform: "translateY(-1px)",
                  boxShadow:
                    "0 6px 14px color-mix(in srgb, var(--mui-palette-primary-main) 20%, transparent)",
                },
                "&:focus-visible": {
                  outline: "2px solid var(--mui-palette-primary-main)",
                  outlineOffset: 2,
                },
                ...userActionButtonSx,
              }}
              title={userEmail ?? undefined}
            >
              {displayUserName}
            </Button>
            <LogoutButton
              isGuest={isGuest}
              sx={{
                ...userActionButtonSx,
              }}
            />
          </Stack>
        </Toolbar>
      </Box>
    </AppBar>
  );
}

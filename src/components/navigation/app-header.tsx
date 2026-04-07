"use client";

import { AutoAwesomeRounded } from "@mui/icons-material";
import { Box, Button, Stack, Toolbar } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { HeaderFrame } from "@/components/navigation/header-frame";
import { LogoutButton } from "@/components/logout-button";
import { getInteractiveFocusSx } from "@/theme/patterns";

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
    <HeaderFrame hidden={!isVisible}>
      <Toolbar
        sx={{
          gap: { xs: 1, sm: 1.4 },
          alignItems: "center",
          py: { xs: 0.6, sm: 1 },
          minHeight: { xs: "58px !important", sm: "72px !important" },
          px: { xs: 1.1, sm: 1.8 },
        }}
      >
        <Stack direction="row" spacing={1.2} alignItems="center" sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: { xs: 36, sm: 40 },
              height: { xs: 36, sm: 40 },
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              background: "linear-gradient(135deg, rgba(173,198,255,0.26), rgba(76,215,246,0.18))",
              color: "secondary.main",
              border: "1px solid rgba(255,255,255,0.08)",
              flexShrink: 0,
            }}
          >
            <AutoAwesomeRounded sx={{ fontSize: 20 }} />
          </Box>
          <Box sx={{ display: { xs: "none", md: "block" }, minWidth: 0 }}>
            <Box
              component="button"
              type="button"
              onClick={() => router.push("/app")}
              sx={{
                all: "unset",
                cursor: "pointer",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 800,
                letterSpacing: "-0.04em",
                display: "block",
              }}
            >
              Task Generator
            </Box>
            <Box sx={{ color: "text.secondary", fontSize: "0.74rem", lineHeight: 1.1 }}>
              Celestial workspace
            </Box>
          </Box>
        </Stack>

        <Box sx={{ flexGrow: 1 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(4, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" },
              gap: { xs: 0.55, sm: 0.9 },
            }}
          >
              {NAV_ITEMS.map((item) => {
                const isActive = item.match(pathname);

                return (
                  <Button
                    key={item.href}
                    aria-current={isActive ? "page" : undefined}
                    size="small"
                    variant={isActive ? "contained" : "text"}
                    color={isActive ? "primary" : "inherit"}
                    onClick={() => {
                      router.push(toCanonicalPath(item.href));
                    }}
                    sx={(theme) => ({
                      ...getInteractiveFocusSx(theme),
                      width: "100%",
                      borderRadius: theme.app.radius.pill,
                      fontSize: { xs: "0.68rem", sm: "0.83rem" },
                      py: { xs: 0.45, sm: 0.75 },
                      px: { xs: 0.5, sm: 1.1 },
                      minHeight: { xs: 30, sm: 38 },
                      lineHeight: 1.1,
                      color: isActive ? undefined : "text.secondary",
                    })}
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
            sx={(theme) => ({
              ...getInteractiveFocusSx(theme),
              border: "1px solid",
              borderColor:
                "color-mix(in srgb, var(--mui-palette-primary-main) 26%, transparent)",
              background:
                "color-mix(in srgb, var(--mui-palette-primary-main) 10%, transparent)",
              fontWeight: 700,
              display: { xs: "none", sm: "block" },
              transition: `transform ${theme.app.motion.duration.fast}ms ${theme.app.motion.easing.standard}, box-shadow ${theme.app.motion.duration.fast}ms ${theme.app.motion.easing.standard}`,
              "&:hover": {
                transform: "translateY(-1px)",
                boxShadow:
                  "0 6px 14px color-mix(in srgb, var(--mui-palette-primary-main) 20%, transparent)",
              },
              ...userActionButtonSx,
            })}
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
    </HeaderFrame>
  );
}

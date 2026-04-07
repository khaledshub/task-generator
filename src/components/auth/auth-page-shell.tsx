"use client";

import { Box, Button, Stack, Typography } from "@mui/material";
import type { PropsWithChildren, ReactNode } from "react";
import { PublicHeader } from "@/components/navigation/public-header";
import { AppShell } from "@/components/ui/app-shell";
import { ActionPanel, FeaturePanel } from "@/components/ui/surface-panel";

interface AuthPageShellProps extends PropsWithChildren {
  eyebrow: string;
  title: string;
  description: string;
  footerAction: ReactNode;
  supportPoints: string[];
}

export function AuthPageShell({
  eyebrow,
  title,
  description,
  footerAction,
  supportPoints,
  children,
}: AuthPageShellProps) {
  return (
    <AppShell header={<PublicHeader />} fullBleed>
      <Box
        sx={{
          minHeight: "calc(100svh - 96px)",
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.15fr) minmax(420px, 0.85fr)" },
          gap: { xs: 3, lg: 4.5 },
          alignItems: "stretch",
          px: { xs: 2, sm: 3, lg: 4 },
          py: { xs: 2, sm: 3, lg: 4 },
          maxWidth: 1380,
          mx: "auto",
        }}
      >
        <FeaturePanel
          tone="spotlight"
          align="left"
          padding={{ xs: 3, sm: 4.5, lg: 5.5 }}
          title={title}
          description={description}
        >
          <Stack spacing={3.5} sx={{ minHeight: "100%", justifyContent: "space-between" }}>
            <Stack spacing={2}>
              <Typography variant="overline" sx={{ letterSpacing: "0.18em", color: "rgba(255,255,255,0.72)" }}>
                {eyebrow}
              </Typography>
              <Typography
                variant="h2"
                sx={{ maxWidth: 620, fontSize: { xs: "2.4rem", sm: "3rem", lg: "4rem" }, lineHeight: 0.98 }}
              >
                Re-enter the workspace with one clear next move.
              </Typography>
              <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.84)", maxWidth: 580 }}>
                Task Generator keeps your next action visible, weighted, and realistic for the time you actually have.
              </Typography>
            </Stack>
            <Stack component="ul" spacing={1.4} sx={{ m: 0, pl: 2.5 }}>
              {supportPoints.map((point) => (
                <Typography component="li" key={point} sx={{ color: "rgba(255,255,255,0.86)" }}>
                  {point}
                </Typography>
              ))}
            </Stack>
            <Stack spacing={2.25}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.25}
                sx={{ alignItems: { xs: "stretch", sm: "center" } }}
              >
                <Box
                  sx={{
                    px: 1.5,
                    py: 0.8,
                    borderRadius: 999,
                    bgcolor: "rgba(76,215,246,0.12)",
                    border: "1px solid rgba(76,215,246,0.2)",
                    color: "secondary.main",
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  Secure session flow
                </Box>
                <Box
                  sx={{
                    px: 1.5,
                    py: 0.8,
                    borderRadius: 999,
                    bgcolor: "rgba(173,198,255,0.12)",
                    border: "1px solid rgba(173,198,255,0.2)",
                    color: "primary.light",
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  Persistent task history
                </Box>
              </Stack>
              <Button href="/" variant="contained" color="inherit">
                See product overview
              </Button>
              <Button href="/signup" variant="outlined" sx={{ color: "common.white", borderColor: "rgba(255,255,255,0.4)" }}>
                Create workspace
              </Button>
            </Stack>
          </Stack>
        </FeaturePanel>

        <ActionPanel
          align="center"
          padding={{ xs: 2.75, sm: 3.75 }}
          title={title}
          description={description}
        >
          <Stack spacing={2.25} alignItems="stretch" sx={{ width: "100%", maxWidth: 460, mx: "auto" }}>
            {children}
            {footerAction}
          </Stack>
        </ActionPanel>
      </Box>
    </AppShell>
  );
}

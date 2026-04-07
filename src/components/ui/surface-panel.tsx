"use client";

import { Paper, Stack, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { PropsWithChildren, ReactNode } from "react";
import { getFeaturePanelSx } from "@/theme/patterns";

interface SurfacePanelProps extends PropsWithChildren {
  title?: string;
  description?: string;
  actions?: ReactNode;
  tone?: "feature" | "spotlight" | "neutral";
  align?: "left" | "center";
  padding?: number | Record<string, number>;
  paperSx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
  headerSx?: SxProps<Theme>;
}

function SurfacePanel({
  children,
  title,
  description,
  actions,
  tone = "neutral",
  align = "left",
  padding = { xs: 2.5, sm: 3.5 },
  paperSx,
  contentSx,
  headerSx,
}: SurfacePanelProps) {
  const isCentered = align === "center";

  return (
    <Paper
      sx={(theme) => ({
        ...getFeaturePanelSx(theme, tone),
        p: padding,
        ...(typeof paperSx === "function" ? paperSx(theme) : paperSx),
      })}
    >
      <Stack
        spacing={title || description || actions ? 2 : 0}
        alignItems={isCentered ? "center" : "stretch"}
        textAlign={isCentered ? "center" : "left"}
        sx={(theme) => ({
          position: "relative",
          zIndex: 1,
          px: { xs: 0.4, sm: 0.7, lg: 0.9 },
          py: { xs: 0.25, sm: 0.35, lg: 0.45 },
          ...(typeof contentSx === "function" ? contentSx(theme) : contentSx),
        })}
      >
        {title || description || actions ? (
          <Stack
            spacing={0.9}
            alignItems={isCentered ? "center" : "flex-start"}
            sx={(theme) => ({
              px: { xs: 0.2, sm: 0.35 },
              ...(typeof headerSx === "function" ? headerSx(theme) : headerSx),
            })}
          >
            {title ? (
              <Typography variant={tone === "neutral" ? "h5" : "h4"} component="h2">
                {title}
              </Typography>
            ) : null}
            {description ? (
              <Typography
                color={tone === "neutral" ? "text.secondary" : "rgba(255,255,255,0.84)"}
                sx={{ maxWidth: 760 }}
              >
                {description}
              </Typography>
            ) : null}
            {actions ? actions : null}
          </Stack>
        ) : null}
        {children}
      </Stack>
    </Paper>
  );
}

export function FeaturePanel(props: SurfacePanelProps) {
  return <SurfacePanel {...props} />;
}

export function ActionPanel(props: Omit<SurfacePanelProps, "tone">) {
  return <SurfacePanel {...props} tone="feature" />;
}

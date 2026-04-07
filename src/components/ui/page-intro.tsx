import { Stack, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { FeaturePanel } from "@/components/ui/surface-panel";

interface PageIntroProps {
  title: string;
  subtitle: string;
  eyebrow?: string;
  actions?: ReactNode;
  panelSx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
}

export function PageIntro({ title, subtitle, eyebrow, actions, panelSx, contentSx }: PageIntroProps) {
  return (
    <FeaturePanel
      tone="neutral"
      padding={{ xs: 3.25, sm: 4.25, lg: 4.9 }}
      paperSx={panelSx}
    >
      <Stack
        spacing={1.5}
        alignItems="flex-start"
        textAlign="left"
        sx={(theme) => ({
          px: { xs: 0.35, sm: 0.5 },
          ...(typeof contentSx === "function" ? contentSx(theme) : contentSx),
        })}
      >
        {eyebrow ? (
          <Typography
            variant="overline"
            sx={{ letterSpacing: "0.2em", color: "secondary.main", fontWeight: 700 }}
          >
            {eyebrow}
          </Typography>
        ) : null}
        <Typography
          variant="h3"
          component="h1"
          sx={{ maxWidth: 720, fontSize: { xs: "2rem", sm: "2.5rem", lg: "3rem" } }}
        >
          {title}
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 760, fontSize: { sm: "1.02rem" } }}>
          {subtitle}
        </Typography>
        {actions ? <Stack direction="row" spacing={1.25}>{actions}</Stack> : null}
      </Stack>
    </FeaturePanel>
  );
}

import { Stack, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { PropsWithChildren, ReactNode } from "react";
import { FeaturePanel } from "@/components/ui/surface-panel";

interface ListSectionProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  panelSx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
  headerSx?: SxProps<Theme>;
}

export function ListSection({
  title,
  subtitle,
  actions,
  children,
  panelSx,
  contentSx,
  headerSx,
}: ListSectionProps) {
  return (
    <FeaturePanel tone="neutral" padding={{ xs: 3, sm: 3.75, lg: 4.25 }} paperSx={panelSx}>
      <Stack
        spacing={2.75}
        sx={(theme) => ({
          px: { xs: 0.35, sm: 0.55 },
          ...(typeof contentSx === "function" ? contentSx(theme) : contentSx),
        })}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.25}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          sx={(theme) => ({
            ...(typeof headerSx === "function" ? headerSx(theme) : headerSx),
          })}
        >
          <Stack spacing={0.4}>
            <Typography variant="h5" component="h2">
              {title}
            </Typography>
            {subtitle ? (
              <Typography color="text.secondary">{subtitle}</Typography>
            ) : null}
          </Stack>
          {actions}
        </Stack>
        {children}
      </Stack>
    </FeaturePanel>
  );
}

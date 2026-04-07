import { Stack } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { PropsWithChildren, ReactNode } from "react";
import { ActionPanel } from "@/components/ui/surface-panel";

interface FilterToolbarProps extends PropsWithChildren {
  title: string;
  description?: string;
  formAction?: string;
  method?: "get" | "post";
  actions?: ReactNode;
  panelSx?: SxProps<Theme>;
  formSx?: SxProps<Theme>;
  fieldsSx?: SxProps<Theme>;
}

export function FilterToolbar({
  children,
  title,
  description,
  formAction,
  method = "get",
  actions,
  panelSx,
  formSx,
  fieldsSx,
}: FilterToolbarProps) {
  return (
    <ActionPanel
      title={title}
      description={description}
      padding={{ xs: 3, sm: 3.75, lg: 4 }}
      paperSx={panelSx}
    >
      <Stack
        component="form"
        action={formAction}
        method={method}
        spacing={2}
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "stretch", md: "flex-end" }}
        sx={(theme) => ({
          px: { xs: 0.35, sm: 0.55 },
          ...(typeof formSx === "function" ? formSx(theme) : formSx),
        })}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={(theme) => ({
            flex: 1,
            ...(typeof fieldsSx === "function" ? fieldsSx(theme) : fieldsSx),
          })}
        >
          {children}
        </Stack>
        {actions}
      </Stack>
    </ActionPanel>
  );
}

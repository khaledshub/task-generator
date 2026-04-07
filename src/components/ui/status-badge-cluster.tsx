import { Stack } from "@mui/material";
import type { PropsWithChildren } from "react";

export function StatusBadgeCluster({ children }: PropsWithChildren) {
  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      {children}
    </Stack>
  );
}

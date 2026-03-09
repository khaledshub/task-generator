"use client";

import { Button } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { signOut } from "next-auth/react";

interface LogoutButtonProps {
  sx?: SxProps<Theme>;
}

export function LogoutButton({ sx }: LogoutButtonProps) {
  return (
    <Button
      color="inherit"
      variant="outlined"
      size="small"
      sx={{
        fontSize: { xs: "0.62rem", sm: "0.78rem" },
        minHeight: { xs: 24, sm: 34 },
        px: { xs: 0.7, sm: 1.2 },
        py: { xs: 0.2, sm: 0.55 },
        lineHeight: 1.1,
        ...sx,
      }}
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      Logout
    </Button>
  );
}

"use client";

import { Button } from "@mui/material";
import { signOut } from "next-auth/react";

export function LogoutButton() {
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
      }}
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      Logout
    </Button>
  );
}

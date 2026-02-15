"use client";

import { Button } from "@mui/material";
import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <Button
      color="inherit"
      variant="outlined"
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      Logout
    </Button>
  );
}

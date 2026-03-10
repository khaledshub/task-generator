"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";

const GUEST_BROWSER_SESSION_COOKIE = "tg_guest_browser";

export function GuestSessionGuard() {
  useEffect(() => {
    const hasBrowserSessionCookie = document.cookie
      .split(";")
      .some((entry) => entry.trim().startsWith(`${GUEST_BROWSER_SESSION_COOKIE}=`));

    if (!hasBrowserSessionCookie) {
      void fetch("/api/auth/guest/cleanup", { method: "POST" }).finally(() => {
        clearGuestBrowserMarkers();
        void signOut({ callbackUrl: "/" });
      });
      return;
    }

    document.cookie = `${GUEST_BROWSER_SESSION_COOKIE}=1; path=/; SameSite=Lax`;
  }, []);

  return null;
}

export function clearGuestBrowserMarkers() {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${GUEST_BROWSER_SESSION_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

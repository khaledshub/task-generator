import type { PaletteMode } from "@mui/material";
import { alpha, createTheme } from "@mui/material/styles";

export function createAppTheme(mode: PaletteMode) {
  const isDark = mode === "dark";

  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? "#60a5fa" : "#2563eb",
        dark: isDark ? "#3b82f6" : "#1d4ed8",
        light: isDark ? "#93c5fd" : "#60a5fa",
        contrastText: isDark ? "#0b1220" : "#f8fafc",
      },
      secondary: {
        main: isDark ? "#22d3ee" : "#0891b2",
        dark: isDark ? "#06b6d4" : "#0e7490",
        light: isDark ? "#67e8f9" : "#22d3ee",
        contrastText: isDark ? "#0b1220" : "#f8fafc",
      },
      background: {
        default: isDark ? "#070d19" : "#eef3ff",
        paper: isDark ? "#111a2b" : "#ffffff",
      },
      text: {
        primary: isDark ? "#e2e8f0" : "#0f172a",
        secondary: isDark ? "#94a3b8" : "#475569",
      },
      success: {
        main: isDark ? "#4ade80" : "#16a34a",
      },
      warning: {
        main: isDark ? "#fbbf24" : "#f59e0b",
      },
      error: {
        main: isDark ? "#f87171" : "#ef4444",
      },
      info: {
        main: isDark ? "#38bdf8" : "#0284c7",
      },
    },
    shape: {
      borderRadius: 16,
    },
    typography: {
      fontFamily: "'Plus Jakarta Sans', 'Space Grotesk', 'Segoe UI', sans-serif",
      h1: { fontWeight: 800, letterSpacing: "-0.03em" },
      h2: { fontWeight: 800, letterSpacing: "-0.03em" },
      h3: { fontWeight: 750, letterSpacing: "-0.02em" },
      h4: { fontWeight: 750, letterSpacing: "-0.02em" },
      h5: { fontWeight: 700, letterSpacing: "-0.01em" },
      h6: { fontWeight: 700 },
      button: {
        fontWeight: 700,
        letterSpacing: "0",
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundImage: isDark
              ? "linear-gradient(180deg, #0b1220 0%, #070d19 100%)"
              : "linear-gradient(180deg, #f8fbff 0%, #eef3ff 100%)",
            color: isDark ? "#e2e8f0" : "#0f172a",
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? "#111a2b" : "#ffffff",
            border: `1px solid ${alpha(
              isDark ? "#93c5fd" : "#2563eb",
              isDark ? 0.24 : 0.1,
            )}`,
            backgroundImage: isDark
              ? "linear-gradient(150deg, rgba(96, 165, 250, 0.08), rgba(34, 211, 238, 0.03))"
              : "linear-gradient(150deg, rgba(37, 99, 235, 0.03), rgba(14, 165, 233, 0.02))",
            boxShadow: isDark
              ? "0 14px 32px rgba(2, 8, 23, 0.48)"
              : "0 12px 28px rgba(15, 23, 42, 0.08)",
            backdropFilter: "blur(5px)",
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? "#111a2b" : "#ffffff",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            textTransform: "none",
            fontWeight: 800,
            transition: "transform 180ms ease, box-shadow 180ms ease",
            "&:hover": {
              transform: "translateY(-1px) scale(1.01)",
              boxShadow: isDark
                ? "0 10px 22px rgba(14, 165, 233, 0.28)"
                : "0 10px 22px rgba(37, 99, 235, 0.22)",
            },
          },
          containedPrimary: {
            color: isDark ? "#0b1220" : "#f8fafc",
            background: isDark
              ? "linear-gradient(96deg, #60a5fa 0%, #22d3ee 100%)"
              : "linear-gradient(96deg, #1d4ed8 0%, #0ea5e9 100%)",
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            border: `1px solid ${alpha(
              isDark ? "#93c5fd" : "#2563eb",
              isDark ? 0.24 : 0.16,
            )}`,
            backgroundColor: alpha(isDark ? "#60a5fa" : "#2563eb", isDark ? 0.14 : 0.08),
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            border: `1px solid ${alpha(
              isDark ? "#93c5fd" : "#2563eb",
              isDark ? 0.26 : 0.16,
            )}`,
          },
        },
      },
    },
  });
}

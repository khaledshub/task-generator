import { createTheme } from "@mui/material/styles";

export const appTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0f766e",
      dark: "#115e59",
      light: "#5eead4",
    },
    secondary: {
      main: "#1f2937",
    },
    background: {
      default: "#f0f7f4",
      paper: "#f8fffc",
    },
    success: {
      main: "#166534",
    },
    warning: {
      main: "#b45309",
    },
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: "'Space Grotesk', 'Avenir Next', 'Segoe UI', sans-serif",
    h1: { fontWeight: 700, letterSpacing: "-0.02em" },
    h2: { fontWeight: 700, letterSpacing: "-0.02em" },
    h3: { fontWeight: 700, letterSpacing: "-0.015em" },
    h4: { fontWeight: 700, letterSpacing: "-0.01em" },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          border: "1px solid rgba(15, 118, 110, 0.12)",
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
          backdropFilter: "blur(8px)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          textTransform: "none",
          fontWeight: 700,
        },
      },
    },
  },
});

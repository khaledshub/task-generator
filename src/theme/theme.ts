import type { PaletteMode } from "@mui/material";
import { alpha, createTheme } from "@mui/material/styles";

export function createAppTheme(mode: PaletteMode) {
  const isDark = mode === "dark";
  const primaryMain = isDark ? "#adc6ff" : "#4d8eff";
  const secondaryMain = isDark ? "#4cd7f6" : "#03b5d3";
  const tertiaryMain = isDark ? "#b6c4ff" : "#748de1";
  const surfaceBorder = alpha(isDark ? "#8c909f" : "#4d8eff", isDark ? 0.15 : 0.12);
  const inverseBorder = isDark ? "rgba(140,144,159,0.15)" : "rgba(77,142,255,0.12)";
  const navBackground = isDark
    ? "rgba(8,14,28,0.78)"
    : "rgba(248,251,255,0.82)";
  const lightGlassStrong = "rgba(255,255,255,0.88)";
  const lightInnerSurface = "rgba(236,243,255,0.92)";

  return createTheme({
    palette: {
      mode,
      primary: {
        main: primaryMain,
        dark: isDark ? "#7ca8ff" : "#005ac2",
        light: isDark ? "#d8e2ff" : "#adc6ff",
        contrastText: isDark ? "#001a42" : "#ffffff",
      },
      secondary: {
        main: secondaryMain,
        dark: isDark ? "#03b5d3" : "#004e5c",
        light: isDark ? "#acedff" : "#4cd7f6",
        contrastText: isDark ? "#003640" : "#ffffff",
      },
      tertiary: {
        main: tertiaryMain,
        dark: isDark ? "#748de1" : "#264191",
        light: isDark ? "#dce1ff" : "#b6c4ff",
        contrastText: isDark ? "#00164e" : "#ffffff",
      },
      background: {
        default: isDark ? "#0b1326" : "#edf4ff",
        paper: isDark ? "#171f33" : "#fdfefe",
      },
      text: {
        primary: isDark ? "#dae2fd" : "#0f172a",
        secondary: isDark ? "#c2c6d6" : "#52607a",
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
        main: isDark ? "#4cd7f6" : "#03b5d3",
      },
    },
    shape: {
      borderRadius: 24,
    },
    typography: {
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      h1: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, letterSpacing: "-0.04em" },
      h2: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, letterSpacing: "-0.04em" },
      h3: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, letterSpacing: "-0.03em" },
      h4: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, letterSpacing: "-0.03em" },
      h5: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, letterSpacing: "-0.02em" },
      h6: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, letterSpacing: "-0.01em" },
      button: {
        fontFamily: "'Inter', sans-serif",
        fontWeight: 700,
        letterSpacing: "0",
      },
      body1: { fontFamily: "'Inter', sans-serif" },
      body2: { fontFamily: "'Inter', sans-serif" },
      overline: { fontFamily: "'Inter', sans-serif", fontWeight: 600 },
      caption: { fontFamily: "'Inter', sans-serif" },
    },
    app: {
      focusRing: `2px solid ${alpha(primaryMain, 0.9)}`,
      radius: {
        section: 24,
        panel: 20,
        control: 16,
        pill: 999,
      },
      contentWidth: {
        narrow: 560,
        content: 1120,
        wide: 1320,
      },
      spacing: {
        shellX: {
          xs: 2,
          sm: 3,
          lg: 4,
        },
        shellY: {
          xs: 3,
          sm: 4,
          lg: 5,
        },
        sectionGap: {
          xs: 3,
          sm: 4,
          lg: 5,
        },
      },
      motion: {
        duration: {
          fast: 180,
          base: 220,
          slow: 340,
        },
        easing: {
          standard: "cubic-bezier(0.2, 0.8, 0.2, 1)",
          emphasized: "cubic-bezier(0.16, 1, 0.3, 1)",
        },
        entranceOffset: 14,
      },
      border: {
        subtle: surfaceBorder,
        strong: alpha(primaryMain, isDark ? 0.2 : 0.16),
        inverse: inverseBorder,
      },
      shadow: {
        soft: isDark
          ? "0 14px 32px rgba(2, 8, 23, 0.48)"
          : "0 18px 36px rgba(73, 104, 169, 0.12)",
        elevated: isDark
          ? "0 22px 40px rgba(2,6,23,0.55)"
          : "0 28px 60px rgba(77,142,255,0.18)",
        spotlight: isDark
          ? "0 48px 48px -12px rgba(173,198,255,0.08)"
          : "0 48px 48px -12px rgba(77,142,255,0.12)",
      },
      gradient: {
        canvas: isDark
          ? "radial-gradient(circle at 0% 0%, rgba(77,142,255,0.18) 0%, transparent 28%), radial-gradient(circle at 100% 100%, rgba(76,215,246,0.16) 0%, transparent 26%), linear-gradient(180deg, #0b1326 0%, #070d19 100%)"
          : "radial-gradient(circle at 0% 0%, rgba(77,142,255,0.1) 0%, transparent 28%), radial-gradient(circle at 100% 100%, rgba(3,181,211,0.12) 0%, transparent 24%), linear-gradient(180deg, #f8fbff 0%, #edf4ff 100%)",
        intro: isDark
          ? "radial-gradient(circle at top right, rgba(77,142,255,0.18), transparent 38%), linear-gradient(180deg, rgba(23,31,51,0.82), rgba(10,16,32,0.84))"
          : "radial-gradient(circle at top right, color-mix(in srgb, var(--mui-palette-primary-main) 18%, transparent), transparent 42%), linear-gradient(180deg, rgba(255,255,255,0.92), rgba(244,248,255,0.88))",
        feature: isDark
          ? "linear-gradient(180deg, rgba(23,31,51,0.78), rgba(10,16,32,0.84))"
          : "linear-gradient(180deg, rgba(255,255,255,0.88), rgba(244,248,255,0.86))",
        spotlight: isDark
          ? "radial-gradient(circle at top right, rgba(76,215,246,0.12), transparent 28%), radial-gradient(circle at bottom left, rgba(77,142,255,0.14), transparent 32%), linear-gradient(180deg, rgba(23,31,51,0.82), rgba(10,16,32,0.9))"
          : "radial-gradient(circle at top right, rgba(3,181,211,0.1), transparent 28%), linear-gradient(180deg, rgba(255,255,255,0.94), rgba(243,248,255,0.92))",
        nav:
          "linear-gradient(180deg, rgba(77,142,255,0.12), transparent)",
      },
      chrome: {
        navBorder: alpha(primaryMain, 0.22),
        navBackground,
        navHighlight:
          "linear-gradient(180deg, rgba(255,255,255,0.08), transparent 42%)",
        navUnderline:
          "linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--mui-palette-primary-main) 44%, transparent) 50%, transparent 100%)",
        navShadow:
          "0 24px 48px color-mix(in srgb, var(--mui-palette-primary-main) 12%, transparent), 0 8px 18px color-mix(in srgb, black 18%, transparent), inset 0 1px 0 color-mix(in srgb, white 36%, transparent), inset 0 -1px 0 color-mix(in srgb, black 22%, transparent)",
      },
      status: {
        activeBg: isDark ? "#4ade80" : "#16a34a",
        activeFg: isDark ? "#052e16" : "#f0fdf4",
        infoBg: isDark ? "#38bdf8" : "#0284c7",
        infoFg: isDark ? "#082f49" : "#f0f9ff",
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundImage: isDark
              ? "radial-gradient(circle at 0% 0%, rgba(77,142,255,0.18) 0%, transparent 24%), radial-gradient(circle at 100% 100%, rgba(76,215,246,0.16) 0%, transparent 26%), linear-gradient(180deg, #0b1220 0%, #070d19 100%)"
              : "radial-gradient(circle at 0% 0%, rgba(77,142,255,0.1) 0%, transparent 26%), radial-gradient(circle at 100% 100%, rgba(3,181,211,0.1) 0%, transparent 24%), linear-gradient(180deg, #f8fbff 0%, #edf4ff 100%)",
            color: isDark ? "#e2e8f0" : "#0f172a",
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? "#111a2b" : lightGlassStrong,
            border: `1px solid ${surfaceBorder}`,
            backgroundImage: isDark
              ? "linear-gradient(180deg, rgba(23,31,51,0.7), rgba(19,27,46,0.7))"
              : "linear-gradient(180deg, rgba(255,255,255,0.86), rgba(244,248,255,0.86))",
            boxShadow: "none",
            backdropFilter: "blur(24px)",
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? "#111a2b" : lightGlassStrong,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 48,
            textTransform: "none",
            fontWeight: 800,
            transition: "transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease",
            "&:hover": {
              transform: "translateY(-1px) scale(1.01)",
              boxShadow: isDark
                ? "0 10px 22px rgba(14, 165, 233, 0.28)"
                : "0 10px 22px rgba(37, 99, 235, 0.22)",
            },
          },
          containedPrimary: {
            color: isDark ? "#00285d" : "#f8fbff",
            background: isDark
              ? "linear-gradient(135deg, #adc6ff 0%, #4d8eff 100%)"
              : "linear-gradient(135deg, #4d8eff 0%, #005ac2 100%)",
            boxShadow: isDark
              ? "0 0 20px rgba(173,198,255,0.2)"
              : "0 0 20px rgba(77,142,255,0.2)",
          },
          outlinedInherit: {
            borderColor: isDark ? "rgba(140,144,159,0.24)" : "rgba(77,142,255,0.18)",
            backgroundColor: isDark ? "rgba(23,31,51,0.44)" : "rgba(255,255,255,0.6)",
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            border: "none",
            borderRadius: 999,
            backgroundColor: isDark ? "#03b5d3" : "#acedff",
            color: isDark ? "#00424e" : "#003640",
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
      MuiContainer: {
        defaultProps: {
          disableGutters: true,
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            backgroundColor: isDark ? "#060e20" : lightInnerSurface,
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: alpha(isDark ? "#8c909f" : "#4d8eff", 0.15),
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: alpha(secondaryMain, 0.24),
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderWidth: 0,
              borderBottom: `1px solid ${secondaryMain}`,
              borderRadius: 16,
            },
          },
        },
      },
    },
  });
}

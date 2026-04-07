import type { Theme } from "@mui/material/styles";
import type { SystemStyleObject } from "@mui/system";
import { alpha } from "@mui/material/styles";

export function getNavChromeSx(theme: Theme): SystemStyleObject<Theme> {
  return {
    width: "100%",
    mx: "auto",
    p: "2px",
    borderRadius: { xs: theme.app.radius.panel, md: theme.app.radius.section },
    border: "1px solid",
    borderColor: theme.app.chrome.navBorder,
    bgcolor: theme.app.chrome.navBackground,
    backgroundImage: theme.app.gradient.nav,
    backdropFilter: "blur(14px)",
    boxShadow: theme.app.chrome.navShadow,
    position: "relative",
    overflow: "visible",
    isolation: "isolate",
    "&::before": {
      content: "\"\"",
      position: "absolute",
      inset: 1,
      borderRadius: theme.app.radius.panel - 1,
      background: theme.app.chrome.navHighlight,
      pointerEvents: "none",
      zIndex: 0,
    },
    "&::after": {
      content: "\"\"",
      position: "absolute",
      left: "2%",
      right: "2%",
      bottom: 0,
      height: 1,
      background: theme.app.chrome.navUnderline,
      pointerEvents: "none",
      zIndex: 0,
    },
    "& > *": {
      position: "relative",
      zIndex: 1,
    },
  };
}

export function getFeaturePanelSx(
  theme: Theme,
  tone: "feature" | "spotlight" | "neutral" = "feature",
): SystemStyleObject<Theme> {
  if (tone === "neutral") {
    return {
      position: "relative",
      overflow: "hidden",
      borderRadius: theme.app.radius.section,
      border: `1px solid ${theme.app.border.subtle}`,
      background: theme.app.gradient.intro,
      boxShadow: theme.app.shadow.soft,
      "&::before": {
        content: "\"\"",
        position: "absolute",
        inset: 0,
        background:
          theme.palette.mode === "dark"
            ? "radial-gradient(circle at top right, rgba(77,142,255,0.08), transparent 32%)"
            : "radial-gradient(circle at top right, rgba(77,142,255,0.08), transparent 34%)",
        pointerEvents: "none",
      },
    };
  }

  const isSpotlight = tone === "spotlight";
  const shadow = isSpotlight ? theme.app.shadow.spotlight : theme.app.shadow.elevated;

  return {
    position: "relative",
    overflow: "hidden",
    isolation: "isolate",
    borderRadius: theme.app.radius.section,
    border: "1px solid",
    borderColor: theme.app.border.inverse,
    background: isSpotlight ? theme.app.gradient.spotlight : theme.app.gradient.feature,
    color: theme.palette.common.white,
    boxShadow: shadow,
    transition: `transform ${theme.app.motion.duration.base}ms ${theme.app.motion.easing.standard}, box-shadow ${theme.app.motion.duration.base}ms ${theme.app.motion.easing.standard}`,
    "&::before": {
      content: "\"\"",
      position: "absolute",
      inset: 1,
      borderRadius: theme.app.radius.section - 1,
      background:
        isSpotlight
          ? "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(147,197,253,0.08) 24%, rgba(56,189,248,0.12) 58%, rgba(0,0,0,0) 100%)"
          : "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(147,197,253,0.06) 20%, rgba(56,189,248,0.09) 54%, rgba(0,0,0,0) 100%)",
      pointerEvents: "none",
      opacity: 1,
      transform: "scale(1)",
      zIndex: 0,
      transition: `transform ${theme.app.motion.duration.slow}ms ${theme.app.motion.easing.standard}, opacity ${theme.app.motion.duration.slow}ms ${theme.app.motion.easing.standard}`,
    },
    "&:hover": {
      transform: "translateY(-3px)",
      boxShadow: isSpotlight
        ? `0 28px 56px ${alpha("#0f172a", theme.palette.mode === "dark" ? 0.56 : 0.3)}`
        : `0 28px 56px ${alpha("#0f172a", theme.palette.mode === "dark" ? 0.62 : 0.26)}`,
      "&::before": {
        opacity: 1,
        transform: "scale(1.01)",
      },
    },
  };
}

export function getInvertedFieldSx(): SystemStyleObject<Theme> {
  return {
    minWidth: { xs: "100%", sm: 180 },
    "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.82)" },
    "& .MuiInputLabel-root.Mui-focused": { color: "common.white" },
    "& .MuiInputBase-input": { color: "common.white" },
    "& .MuiOutlinedInput-root": {
      bgcolor: "rgba(6,14,32,0.72)",
      backdropFilter: "blur(12px)",
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "rgba(255,255,255,0.35)",
    },
    "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "rgba(255,255,255,0.6)",
    },
    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "rgba(255,255,255,0.8)",
    },
    "& .MuiSvgIcon-root": { color: "rgba(255,255,255,0.9)" },
  };
}

export function getInteractiveFocusSx(theme: Theme): SystemStyleObject<Theme> {
  return {
    "&:focus-visible": {
      outline: theme.app.focusRing,
      outlineOffset: 2,
    },
  };
}

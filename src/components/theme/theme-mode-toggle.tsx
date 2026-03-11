"use client";

import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import { IconButton, Paper, Tooltip } from "@mui/material";
import { motion } from "framer-motion";
import { useThemeMode } from "@/components/theme/theme-mode-provider";

export function ThemeModeToggle() {
  const { mode, toggleMode } = useThemeMode();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{
        position: "fixed",
        right: 20,
        bottom: 20,
        zIndex: 1400,
      }}
    >
      <Paper elevation={5} sx={{ borderRadius: 99, p: 0.3 }}>
        <Tooltip title={mode === "light" ? "Switch to dark mode" : "Switch to light mode"}>
          <IconButton
            aria-label={mode === "light" ? "Switch to dark mode" : "Switch to light mode"}
            onClick={toggleMode}
            color="primary"
          >
            {mode === "light" ? <DarkModeRoundedIcon /> : <LightModeRoundedIcon />}
          </IconButton>
        </Tooltip>
      </Paper>
    </motion.div>
  );
}

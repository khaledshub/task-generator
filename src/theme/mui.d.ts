import "@mui/material/styles";
import type { PaletteColor, PaletteColorOptions } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Palette {
    tertiary: PaletteColor;
  }

  interface PaletteOptions {
    tertiary?: PaletteColorOptions;
  }

  interface Theme {
    app: {
      focusRing: string;
      radius: {
        section: number;
        panel: number;
        control: number;
        pill: number;
      };
      contentWidth: {
        narrow: number;
        content: number;
        wide: number;
      };
      spacing: {
        shellX: {
          xs: number;
          sm: number;
          lg: number;
        };
        shellY: {
          xs: number;
          sm: number;
          lg: number;
        };
        sectionGap: {
          xs: number;
          sm: number;
          lg: number;
        };
      };
      motion: {
        duration: {
          fast: number;
          base: number;
          slow: number;
        };
        easing: {
          standard: string;
          emphasized: string;
        };
        entranceOffset: number;
      };
      border: {
        subtle: string;
        strong: string;
        inverse: string;
      };
      shadow: {
        soft: string;
        elevated: string;
        spotlight: string;
      };
      gradient: {
        canvas: string;
        intro: string;
        feature: string;
        spotlight: string;
        nav: string;
      };
      chrome: {
        navBorder: string;
        navBackground: string;
        navHighlight: string;
        navUnderline: string;
        navShadow: string;
      };
      status: {
        activeBg: string;
        activeFg: string;
        infoBg: string;
        infoFg: string;
      };
    };
  }

  interface ThemeOptions {
    app?: Partial<Theme["app"]>;
  }
}

export {};

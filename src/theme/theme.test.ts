import { describe, expect, it } from "vitest";
import { createAppTheme } from "@/theme/theme";

describe("createAppTheme", () => {
  it("provides semantic app tokens for dark mode", () => {
    const theme = createAppTheme("dark");

    expect(theme.app.contentWidth.content).toBeGreaterThan(1000);
    expect(theme.app.gradient.feature).toContain("linear-gradient");
    expect(theme.app.motion.duration.base).toBe(220);
    expect(theme.app.border.inverse).toContain("rgba");
  });

  it("keeps semantic app tokens available in light mode", () => {
    const theme = createAppTheme("light");

    expect(theme.app.focusRing).toContain("solid");
    expect(theme.app.gradient.intro).toContain("color-mix");
    expect(theme.app.status.activeBg).toBeTruthy();
  });
});

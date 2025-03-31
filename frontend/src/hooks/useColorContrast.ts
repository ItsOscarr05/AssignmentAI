import { useEffect, useState } from "react";

interface ColorContrastOptions {
  minContrastRatio?: number;
  highContrastMode?: boolean;
}

export function useColorContrast({
  minContrastRatio = 4.5,
  highContrastMode = false,
}: ColorContrastOptions = {}) {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);

  useEffect(() => {
    // Check system preferences for high contrast mode
    const mediaQuery = window.matchMedia("(forced-colors: active)");
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersHighContrast(e.matches);
    };

    setPrefersHighContrast(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  const getContrastRatio = (color1: string, color2: string): number => {
    const getLuminance = (r: number, g: number, b: number): number => {
      const [rs, gs, bs] = [r, g, b].map((c) => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const hexToRgb = (hex: string): [number, number, number] => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16),
          ]
        : [0, 0, 0];
    };

    const [r1, g1, b1] = hexToRgb(color1);
    const [r2, g2, b2] = hexToRgb(color2);

    const l1 = getLuminance(r1, g1, b1);
    const l2 = getLuminance(r2, g2, b2);

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  };

  const isContrastSufficient = (
    foreground: string,
    background: string
  ): boolean => {
    return getContrastRatio(foreground, background) >= minContrastRatio;
  };

  return {
    prefersHighContrast,
    isContrastSufficient,
    getContrastRatio,
  };
}

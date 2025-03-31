import { useEffect, useRef } from "react";

interface UseAriaLiveOptions {
  politeness?: "polite" | "assertive";
  id?: string;
}

export function useAriaLive({
  politeness = "polite",
  id = "aria-live",
}: UseAriaLiveOptions = {}) {
  const liveRegionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const liveRegion = document.createElement("div");
    liveRegion.id = id;
    liveRegion.setAttribute("aria-live", politeness);
    liveRegion.setAttribute("aria-atomic", "true");
    liveRegion.style.position = "absolute";
    liveRegion.style.width = "1px";
    liveRegion.style.height = "1px";
    liveRegion.style.margin = "-1px";
    liveRegion.style.padding = "0";
    liveRegion.style.overflow = "hidden";
    liveRegion.style.clip = "rect(0, 0, 0, 0)";
    liveRegion.style.whiteSpace = "nowrap";
    liveRegion.style.border = "0";
    document.body.appendChild(liveRegion);
    liveRegionRef.current = liveRegion;

    return () => {
      document.body.removeChild(liveRegion);
    };
  }, [id, politeness]);

  const announce = (message: string) => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = message;
    }
  };

  return { announce };
}

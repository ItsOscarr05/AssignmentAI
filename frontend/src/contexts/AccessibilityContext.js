import React, { createContext, useContext, useState, useEffect } from "react";

const AccessibilityContext = createContext(null);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error(
      "useAccessibility must be used within an AccessibilityProvider"
    );
  }
  return context;
};

export const AccessibilityProvider = ({ children }) => {
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem("accessibility_preferences");
    return saved
      ? JSON.parse(saved)
      : {
          highContrast: false,
          largeText: false,
          reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches,
          screenReader: false,
        };
  });

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem(
      "accessibility_preferences",
      JSON.stringify(preferences)
    );
  }, [preferences]);

  // Listen for system reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = (e) => {
      setPreferences((prev) => ({
        ...prev,
        reducedMotion: e.matches,
      }));
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const toggleHighContrast = () => {
    setPreferences((prev) => ({
      ...prev,
      highContrast: !prev.highContrast,
    }));
  };

  const toggleLargeText = () => {
    setPreferences((prev) => ({
      ...prev,
      largeText: !prev.largeText,
    }));
  };

  const toggleReducedMotion = () => {
    setPreferences((prev) => ({
      ...prev,
      reducedMotion: !prev.reducedMotion,
    }));
  };

  const toggleScreenReader = () => {
    setPreferences((prev) => ({
      ...prev,
      screenReader: !prev.screenReader,
    }));
  };

  const value = {
    ...preferences,
    toggleHighContrast,
    toggleLargeText,
    toggleReducedMotion,
    toggleScreenReader,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

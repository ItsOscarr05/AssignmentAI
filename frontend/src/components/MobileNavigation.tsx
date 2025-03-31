import { useGesture } from "@use-gesture/react";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMediaQuery } from "../hooks/useMediaQuery";

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: "/", label: "Home", icon: "🏠" },
  { path: "/assignments", label: "Assignments", icon: "📚" },
  { path: "/submissions", label: "Submissions", icon: "📝" },
  { path: "/profile", label: "Profile", icon: "👤" },
];

export const MobileNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Hide navigation on scroll
  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsVisible(currentScrollY < lastScrollY);
      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Gesture support for swipe navigation
  const bind = useGesture({
    onDrag: ({ movement: [mx], direction: [dx], velocity: [vx] }) => {
      if (Math.abs(mx) > 50 && vx > 0.5) {
        const currentIndex = navItems.findIndex(
          (item) => item.path === location.pathname
        );
        const newIndex =
          dx > 0
            ? Math.max(0, currentIndex - 1)
            : Math.min(navItems.length - 1, currentIndex + 1);
        navigate(navItems[newIndex].path);
      }
    },
    onTouchStart: () => {
      setIsVisible(true);
    },
  });

  if (!isMobile) return null;

  return (
    <nav className={`nav ${isVisible ? "slide-up" : ""}`} {...bind()}>
      <ul className="nav-list">
        {navItems.map((item) => (
          <li key={item.path}>
            <a
              href={item.path}
              className={`nav-item ${
                location.pathname === item.path ? "active" : ""
              }`}
              onClick={(e) => {
                e.preventDefault();
                navigate(item.path);
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

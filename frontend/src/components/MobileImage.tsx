import React, { useEffect, useRef, useState } from "react";
import { useBreakpoints } from "../hooks/useMediaQuery";

interface MobileImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export const MobileImage: React.FC<MobileImageProps> = ({
  src,
  alt,
  width,
  height,
  className = "",
  onLoad,
  onError,
}) => {
  const { isMobile } = useBreakpoints();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Create intersection observer for lazy loading
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            img.src = img.dataset.src || "";
            observerRef.current?.unobserve(img);
          }
        });
      },
      {
        rootMargin: "50px",
        threshold: 0.1,
      }
    );

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (imageRef.current) {
      observerRef.current?.observe(imageRef.current);
    }
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = (error: Error) => {
    setIsError(true);
    onError?.(error);
  };

  // Generate a tiny placeholder for blur effect
  const generatePlaceholder = (width: number, height: number) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#f0f0f0";
      ctx.fillRect(0, 0, width, height);
      return canvas.toDataURL();
    }
    return "";
  };

  const placeholder = width && height ? generatePlaceholder(width, height) : "";

  return (
    <div
      className={`mobile-image-container ${className} ${
        isLoaded ? "loaded" : "loading"
      }`}
      style={{
        width: width ? `${width}px` : "100%",
        height: height ? `${height}px` : "auto",
        aspectRatio: width && height ? width / height : "auto",
      }}
    >
      {placeholder && (
        <img
          src={placeholder}
          alt=""
          className="placeholder"
          style={{ filter: "blur(10px)" }}
        />
      )}
      <img
        ref={imageRef}
        data-src={src}
        alt={alt}
        className={`mobile-image ${isLoaded ? "fade-in" : ""}`}
        onLoad={handleLoad}
        onError={() => handleError(new Error(`Failed to load image: ${src}`))}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      {isError && (
        <div className="error-overlay">
          <span>Failed to load image</span>
        </div>
      )}
    </div>
  );
};

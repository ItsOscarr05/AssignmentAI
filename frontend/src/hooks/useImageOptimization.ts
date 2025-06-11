import { useEffect, useState } from 'react';

interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

interface ImageState {
  src: string;
  loading: boolean;
  error: Error | null;
}

export function useImageOptimization(originalSrc: string, options: ImageOptimizationOptions = {}) {
  const [state, setState] = useState<ImageState>({
    src: originalSrc,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const optimizeImage = async () => {
      try {
        setState(prev => ({ ...prev, loading: true }));

        // Check if the image is already cached
        const cacheKey = `img_${originalSrc}_${options.width}_${options.height}_${options.quality}_${options.format}`;
        const cachedImage = localStorage.getItem(cacheKey);

        if (cachedImage) {
          setState({
            src: cachedImage,
            loading: false,
            error: null,
          });
          return;
        }

        // Create an image element to get dimensions
        const img = new Image();
        img.src = originalSrc;

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        // Create a canvas for image optimization
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');

        // Calculate dimensions maintaining aspect ratio
        const aspectRatio = img.width / img.height;
        const width = options.width || img.width;
        const height = options.height || width / aspectRatio;

        canvas.width = width;
        canvas.height = height;

        // Draw and optimize image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to optimized format
        const quality = options.quality || 0.8;
        const format = options.format || 'webp';
        const optimizedSrc = canvas.toDataURL(`image/${format}`, quality);

        // Cache the optimized image
        localStorage.setItem(cacheKey, optimizedSrc);

        setState({
          src: optimizedSrc,
          loading: false,
          error: null,
        });
      } catch (error) {
        setState({
          src: originalSrc, // Fallback to original image
          loading: false,
          error: error as Error,
        });
      }
    };

    optimizeImage();
  }, [originalSrc, options.width, options.height, options.quality, options.format]);

  return state;
}

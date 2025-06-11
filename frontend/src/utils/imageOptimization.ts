import { performanceConfig } from '../config/performance';

interface ImageOptimizationOptions {
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  width?: number;
  height?: number;
  lazyLoad?: boolean;
}

interface ResponsiveImage {
  src: string;
  srcSet: string;
  sizes: string;
  alt: string;
  loading?: 'lazy' | 'eager';
}

export const optimizeImage = (src: string, options: ImageOptimizationOptions = {}): string => {
  const {
    quality = performanceConfig.imageOptimization.quality,
    format = 'webp',
    width = performanceConfig.imageOptimization.maxWidth,
    height,
  } = options;

  // Create a URL object to manipulate the image URL
  const url = new URL(src);

  // Add optimization parameters
  url.searchParams.set('q', quality.toString());
  url.searchParams.set('format', format);
  url.searchParams.set('w', width.toString());

  if (height) {
    url.searchParams.set('h', height.toString());
  }

  return url.toString();
};

export const createResponsiveImage = (
  src: string,
  alt: string,
  breakpoints: number[] = [640, 768, 1024, 1280, 1536],
  options: ImageOptimizationOptions = {}
): ResponsiveImage => {
  const { lazyLoad = performanceConfig.imageOptimization.lazyLoad } = options;
  const srcSet = breakpoints
    .map(width => {
      const optimizedUrl = optimizeImage(src, { ...options, width });
      return `${optimizedUrl} ${width}w`;
    })
    .join(', ');

  const sizes = breakpoints
    .map((width, index) => {
      if (index === breakpoints.length - 1) {
        return `${width}px`;
      }
      return `(max-width: ${width}px) ${width}px`;
    })
    .join(', ');

  return {
    src: optimizeImage(src, { ...options, width: breakpoints[0] }),
    srcSet,
    sizes,
    alt,
    loading: lazyLoad ? 'lazy' : 'eager',
  };
};

export const getImageDimensions = async (
  src: string
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.onerror = reject;
    img.src = src;
  });
};

export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

export const isWebPSupported = (): boolean => {
  const elem = document.createElement('canvas');
  if (elem.getContext && elem.getContext('2d')) {
    return elem.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
  return false;
};

export const isAvifSupported = async (): Promise<boolean> => {
  const avif = new Image();
  avif.src =
    'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  return new Promise(resolve => {
    avif.onload = () => resolve(true);
    avif.onerror = () => resolve(false);
  });
};

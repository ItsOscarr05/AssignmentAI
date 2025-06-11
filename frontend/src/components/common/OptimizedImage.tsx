import { Box, Skeleton } from '@mui/material';
import React, { useEffect, useState } from 'react';
import {
  createResponsiveImage,
  getImageDimensions,
  isAvifSupported,
  isWebPSupported,
  preloadImage,
} from '../../utils/imageOptimization';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  priority?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width = '100%',
  height = 'auto',
  objectFit = 'cover',
  priority = false,
  className,
  style,
  onLoad,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [supportsWebP, setSupportsWebP] = useState(false);
  const [supportsAvif, setSupportsAvif] = useState(false);

  useEffect(() => {
    const checkFormatSupport = async () => {
      setSupportsWebP(isWebPSupported());
      setSupportsAvif(await isAvifSupported());
    };

    checkFormatSupport();
  }, []);

  useEffect(() => {
    const loadImage = async () => {
      try {
        setIsLoading(true);
        await getImageDimensions(src);

        if (priority) {
          await preloadImage(src);
        }

        setIsLoading(false);
        onLoad?.();
      } catch (error) {
        setIsLoading(false);
        onError?.();
      }
    };

    loadImage();
  }, [src, priority, onLoad, onError]);

  const responsiveImage = createResponsiveImage(src, alt, undefined, {
    format: supportsAvif ? 'avif' : supportsWebP ? 'webp' : 'jpeg',
    lazyLoad: !priority,
  });

  if (isLoading) {
    return (
      <Skeleton variant="rectangular" width={width} height={height} sx={{ borderRadius: 1 }} />
    );
  }

  return (
    <Box
      component="picture"
      sx={{
        display: 'block',
        width,
        height,
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
      className={className}
    >
      {supportsAvif && (
        <source srcSet={responsiveImage.srcSet} sizes={responsiveImage.sizes} type="image/avif" />
      )}
      {supportsWebP && !supportsAvif && (
        <source srcSet={responsiveImage.srcSet} sizes={responsiveImage.sizes} type="image/webp" />
      )}
      <Box
        component="img"
        src={responsiveImage.src}
        srcSet={responsiveImage.srcSet}
        sizes={responsiveImage.sizes}
        alt={responsiveImage.alt}
        loading={responsiveImage.loading}
        sx={{
          width: '100%',
          height: '100%',
          objectFit,
          display: 'block',
        }}
      />
    </Box>
  );
};

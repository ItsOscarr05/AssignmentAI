import { Box } from '@mui/material';
import React, { useEffect, useRef } from 'react';
import { useAdContext } from '../../contexts/AdContext';

// Type declaration for Google AdSense
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdComponentProps {
  position: 'top' | 'bottom' | 'sidebar';
  // Optional ad slot ID - if not provided, will use auto ads
  adSlot?: string;
}

const AdComponent: React.FC<AdComponentProps> = ({ position, adSlot }) => {
  const { showAds, isLoading } = useAdContext();
  const adRef = useRef<HTMLDivElement>(null);
  const adPushed = useRef(false);

  // AdSense publisher ID
  const adClient = 'ca-pub-7776520245096503';

  // Different ad configurations based on position
  const adConfigs = {
    top: {
      width: '100%',
      height: '90px',
      marginBottom: '20px',
      adFormat: 'auto' as const,
      responsive: true,
    },
    bottom: {
      width: '100%',
      height: '90px',
      marginTop: '20px',
      adFormat: 'auto' as const,
      responsive: true,
    },
    sidebar: {
      width: '300px',
      height: '600px',
      marginLeft: '20px',
      adFormat: 'vertical' as const,
      responsive: false,
    },
  };

  useEffect(() => {
    if (isLoading || !showAds || adPushed.current) {
      return;
    }

    // Wait for AdSense script to load
    const tryPushAd = () => {
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        try {
          // Push ad configuration to AdSense queue
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          adPushed.current = true;
        } catch (error) {
          console.error(`[AdComponent:${position}] Error loading ad:`, error);
        }
      } else {
        // Retry after a short delay if script hasn't loaded yet
        setTimeout(tryPushAd, 100);
      }
    };

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(tryPushAd, 100);

    return () => clearTimeout(timeoutId);
  }, [isLoading, showAds, position]);

  if (isLoading || !showAds) {
    return null;
  }

  const config = adConfigs[position];

  // Build sx props based on position
  const sxProps = {
    width: config.width,
    minHeight: config.height,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '4px',
    overflow: 'hidden',
    ...(position === 'top' && { marginBottom: '20px' }),
    ...(position === 'bottom' && { marginTop: '20px' }),
    ...(position === 'sidebar' && { marginLeft: '20px' }),
  };

  return (
    <Box
      ref={adRef}
      sx={sxProps}
    >
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
          width: '100%',
          height: config.height,
        }}
        data-ad-client={adClient}
        {...(adSlot && { 'data-ad-slot': adSlot })}
        data-ad-format={config.adFormat}
        data-full-width-responsive={config.responsive ? 'true' : 'false'}
      />
    </Box>
  );
};

export default AdComponent;

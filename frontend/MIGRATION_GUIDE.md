# Aspect Ratio-Based Responsive Design Migration Guide

## Overview

This guide helps you migrate from the traditional pixel-based responsive design system to the new aspect ratio-based system. The new system provides better adaptability across different screen shapes and orientations.

## Key Changes

### 1. Breakpoint System

**Old (Pixel-based):**

```typescript
// Traditional breakpoints
xs: 0-599px
sm: 600-959px
md: 960-1279px
lg: 1280-1919px
xl: 1920px+
```

**New (Aspect Ratio-based):**

```typescript
// Aspect ratio breakpoints
tall: ratio < 0.9 (portrait phones)
square: 0.9 ≤ ratio < 1.2 (tablets, foldables)
standard: 1.2 ≤ ratio < 1.5 (traditional monitors)
wide: 1.5 ≤ ratio < 2.0 (widescreen displays)
ultra-wide: ratio ≥ 2.0 (ultra-wide monitors)
```

### 2. Hook Migration

**Old:**

```typescript
import { useMediaQuery } from '@mui/material';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
const { currentBreakpoint, isMobile, isTablet, isDesktop } = useResponsiveLayout();
```

**New:**

```typescript
import { useAspectRatio } from '../hooks/useAspectRatio';

const {
  breakpoint,
  isMobile,
  isTablet,
  isDesktop,
  isUltraWide,
  isWide,
  isStandard,
  isSquare,
  isTall,
} = useAspectRatio();
```

### 3. Component Migration

#### ResponsiveLayout Component

**Old:**

```typescript
<ResponsiveLayout maxWidth="lg" padding={{ xs: 2, sm: 3, md: 4 }}>
  {children}
</ResponsiveLayout>
```

**New:**

```typescript
<ResponsiveLayout maxWidth="wide" useAspectRatio={true}>
  {children}
</ResponsiveLayout>
```

#### ResponsiveCard Component

**Old:**

```typescript
<ResponsiveCard title="Card Title" description="Description">
  {content}
</ResponsiveCard>
```

**New:**

```typescript
<ResponsiveCard title="Card Title" description="Description" useAspectRatio={true}>
  {content}
</ResponsiveCard>
```

#### ResponsiveGrid Component

**Old:**

```typescript
<ResponsiveGrid columns={{ xs: 1, sm: 2, md: 3, lg: 4 }}>{items}</ResponsiveGrid>
```

**New:**

```typescript
<ResponsiveGrid useAspectRatio={true}>{items}</ResponsiveGrid>
```

## Migration Steps

### Step 1: Update Imports

Replace pixel-based responsive imports with aspect ratio-based ones:

```typescript
// Before
import { useMediaQuery } from '@mui/material';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

// After
import { useAspectRatio } from '../hooks/useAspectRatio';
```

### Step 2: Update Hook Usage

```typescript
// Before
const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
const { currentBreakpoint, isMobile, isTablet, isDesktop } = useResponsiveLayout();

// After
const { breakpoint, isMobile, isTablet, isDesktop } = useAspectRatio();
```

### Step 3: Update Component Props

Add `useAspectRatio={true}` to components that support the new system:

```typescript
// Before
<ResponsiveLayout maxWidth="lg">
<ResponsiveCard title="Title">
<ResponsiveGrid columns={{ xs: 1, sm: 2 }}>

// After
<ResponsiveLayout maxWidth="wide" useAspectRatio={true}>
<ResponsiveCard title="Title" useAspectRatio={true}>
<ResponsiveGrid useAspectRatio={true}>
```

### Step 4: Update Style Logic

Replace pixel-based style logic with aspect ratio-based logic:

```typescript
// Before
const getTypographySize = () => {
  if (isMobile) return 'h6';
  return 'h5';
};

// After
const getTypographySize = () => {
  if (isMobile) return 'h6';
  if (isTablet) return 'h5';
  return 'h4';
};
```

## Migration Utilities

### useResponsiveMigration Hook

For components that need to support both systems during transition:

```typescript
import { useResponsiveMigration } from '../utils/responsiveMigration';

const { isUsingAspectRatio, getResponsiveValue, mapPixelToAspectRatio } = useResponsiveMigration({
  useAspectRatio: true,
  fallbackToPixel: true,
});
```

### createResponsiveStyles Helper

```typescript
import { createResponsiveStyles } from '../utils/responsiveMigration';

const styles = createResponsiveStyles(
  aspectRatioStyles, // New aspect ratio styles
  pixelStyles, // Old pixel styles
  { useAspectRatio: true }
);
```

## Backward Compatibility

All updated components maintain backward compatibility:

- Components accept a `useAspectRatio` prop (defaults to `true`)
- When `useAspectRatio={false}`, components fall back to pixel-based behavior
- Existing code continues to work without changes

## Testing Migration

### 1. Test Different Aspect Ratios

```typescript
// Test ultra-wide displays
Object.defineProperty(window, 'innerWidth', { value: 2560 });
Object.defineProperty(window, 'innerHeight', { value: 1080 });

// Test tall displays (portrait phones)
Object.defineProperty(window, 'innerWidth', { value: 375 });
Object.defineProperty(window, 'innerHeight', { value: 812 });
```

### 2. Test Responsive Behavior

```typescript
// Test breakpoint changes
const { result } = renderHook(() => useAspectRatio());
expect(result.current.breakpoint).toBe('wide');
```

## Best Practices

### 1. Progressive Migration

- Start with new components using aspect ratio system
- Gradually migrate existing components
- Use `useAspectRatio={false}` for components not ready for migration

### 2. Responsive Design Principles

- Design for aspect ratios, not just screen sizes
- Consider content flow across different screen shapes
- Test on ultra-wide and tall displays

### 3. Performance Considerations

- The aspect ratio system is optimized for performance
- Debouncing is built-in to prevent excessive updates
- Use the utility functions for efficient style calculations

## Troubleshooting

### Common Issues

1. **Component not responding to aspect ratio changes**

   - Ensure `useAspectRatio={true}` is set
   - Check that the component is wrapped in necessary providers

2. **Styles not applying correctly**

   - Verify aspect ratio breakpoint values
   - Check that `getAspectRatioStyle` is being used correctly

3. **Backward compatibility issues**
   - Set `useAspectRatio={false}` to fall back to pixel-based system
   - Use `useResponsiveMigration` for hybrid approaches

### Debug Tools

```typescript
// Debug current aspect ratio state
const { breakpoint, ratio, orientation } = useAspectRatio();
console.log('Current breakpoint:', breakpoint);
console.log('Aspect ratio:', ratio);
console.log('Orientation:', orientation);
```

## Examples

### Complete Component Migration

**Before:**

```typescript
import { useMediaQuery, useTheme } from '@mui/material';

const MyComponent = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ padding: isMobile ? 2 : 4 }}>
      <Typography variant={isMobile ? 'h6' : 'h4'}>Title</Typography>
    </Box>
  );
};
```

**After:**

```typescript
import { useAspectRatio } from '../hooks/useAspectRatio';
import { aspectRatioStyles, getAspectRatioStyle } from '../styles/aspectRatioBreakpoints';

const MyComponent = () => {
  const { breakpoint, isMobile, isTablet } = useAspectRatio();

  return (
    <Box
      sx={{
        padding: getAspectRatioStyle(aspectRatioStyles.container.padding, breakpoint, 3),
      }}
    >
      <Typography
        variant={isMobile ? 'h6' : isTablet ? 'h5' : 'h4'}
        sx={{
          fontSize: getAspectRatioStyle(
            aspectRatioStyles.typography.h1.fontSize,
            breakpoint,
            '2rem'
          ),
        }}
      >
        Title
      </Typography>
    </Box>
  );
};
```

This migration guide provides a comprehensive approach to transitioning to the new aspect ratio-based responsive design system while maintaining backward compatibility and ensuring a smooth development experience.

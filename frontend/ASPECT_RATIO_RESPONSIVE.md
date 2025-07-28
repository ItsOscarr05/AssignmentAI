# Aspect Ratio-Based Responsive Design

This document explains the new aspect ratio-based responsive design system implemented in the AssignmentAI project. This system classifies screen sizes by their aspect ratio rather than pixel dimensions, providing more intuitive and device-agnostic responsive behavior.

## Overview

Traditional responsive design uses pixel-based breakpoints (e.g., 768px, 1024px) to determine layout changes. Our new system uses aspect ratios instead, which better represents how content will actually be displayed and provides more meaningful responsive behavior.

## Aspect Ratio Breakpoints

The system defines five main aspect ratio categories:

### 1. Ultra-Wide (> 2:1)

- **Ratio**: > 2.0
- **Examples**: 21:9 monitors, 32:9 gaming displays, cinema displays
- **Use Case**: Gaming, productivity, video editing
- **Layout**: 4-column grid, full-width containers

### 2. Wide (16:9 and wider)

- **Ratio**: ≥ 1.78 (16:9)
- **Examples**: 16:9 desktop monitors, laptops, TVs, phones in landscape
- **Use Case**: Standard desktop and laptop usage
- **Layout**: 2-column grid, horizontal layout, 1400px max-width

### 3. Standard (Below 16:9)

- **Ratio**: 1.2 - 1.77
- **Examples**: 4:3 tablets, 3:2 laptops, older monitors, smaller windows
- **Use Case**: Tablet and some laptop usage, smaller browser windows
- **Layout**: 1-column grid, vertical stacking, 1200px max-width

### 4. Square (0.9:1 - 1.2:1)

- **Ratio**: 0.9 - 1.19
- **Examples**: Some tablets, foldables, square displays
- **Use Case**: Tablet and foldable device usage
- **Layout**: 2-column grid, 1000px max-width

### 5. Tall (< 0.9:1)

- **Ratio**: < 0.9
- **Examples**: Phones in portrait, some tablets in portrait
- **Use Case**: Mobile phone usage
- **Layout**: 1-column grid, full-width

## Core Components

### 1. useAspectRatio Hook

The main hook that calculates and tracks aspect ratios:

```typescript
import { useAspectRatio } from '../hooks/useAspectRatio';

const MyComponent = () => {
  const {
    breakpoint, // Current breakpoint name
    ratio, // Current aspect ratio (width/height)
    orientation, // 'portrait', 'landscape', or 'square'
    width, // Current window width
    height, // Current window height
    isUltraWide, // Boolean flags for each breakpoint
    isWide,
    isStandard,
    isSquare,
    isTall,
    isMobile, // Device type classification
    isTablet,
    isDesktop,
    getBreakpointInfo, // Get detailed breakpoint information
    isBreakpoint, // Check if current breakpoint matches
    isBreakpointOrLarger, // Check if current breakpoint is >= target
    isBreakpointOrSmaller, // Check if current breakpoint is <= target
  } = useAspectRatio({
    // Optional custom breakpoints
    breakpoints: customBreakpoints,
    // Optional callbacks
    onBreakpointChange: breakpoint => console.log(breakpoint),
    onOrientationChange: orientation => console.log(orientation),
    onRatioChange: ratio => console.log(ratio),
    // Debounce resize events (default: 100ms)
    debounceMs: 100,
  });

  return (
    <div>
      <p>Current aspect ratio: {ratio.toFixed(2)}:1</p>
      <p>Breakpoint: {breakpoint}</p>
      <p>Orientation: {orientation}</p>
    </div>
  );
};
```

### 2. AspectRatioLayout Component

A responsive layout component that adapts based on aspect ratios:

```typescript
import AspectRatioLayout from '../components/layout/AspectRatioLayout';

const MyPage = () => {
  return (
    <AspectRatioLayout
      maxWidth="wide" // 'ultra-wide' | 'wide' | 'standard' | 'square' | 'tall'
      centered={true}
      spacing={3}
      columns={{
        'ultra-wide': 4,
        wide: 3,
        standard: 2,
        square: 2,
        tall: 1,
      }}
      gap={{
        'ultra-wide': 4,
        wide: 3,
        standard: 2,
        square: 2,
        tall: 1,
      }}
    >
      <div>Content 1</div>
      <div>Content 2</div>
      <div>Content 3</div>
    </AspectRatioLayout>
  );
};
```

### 3. AspectRatioCard Component

A responsive card component that adapts its layout and styling:

```typescript
import AspectRatioCard from '../components/common/AspectRatioCard';

const MyCards = () => {
  return (
    <AspectRatioCard
      title="Card Title"
      description="Card description that adapts to aspect ratio"
      image="/path/to/image.jpg"
      variant="elevation"
      elevation={2}
    >
      <div>Additional card content</div>
    </AspectRatioCard>
  );
};
```

### 4. Aspect Ratio Styles

Predefined styles for different aspect ratios:

```typescript
import { aspectRatioStyles, getAspectRatioStyle } from '../styles/aspectRatioBreakpoints';

const MyComponent = () => {
  const { breakpoint } = useAspectRatio();

  const fontSize = getAspectRatioStyle(
    aspectRatioStyles.typography.h1.fontSize,
    breakpoint,
    '2rem' // fallback
  );

  return <h1 style={{ fontSize }}>Responsive Title</h1>;
};
```

## CSS Media Queries

The system also provides CSS media queries for aspect ratio-based styling:

```css
/* Ultra-wide displays */
@media (min-aspect-ratio: 2/1) {
  .my-component {
    grid-template-columns: repeat(4, 1fr);
    font-size: 1.125rem;
  }
}

/* Wide displays */
@media (min-aspect-ratio: 3/2) and (max-aspect-ratio: 2/1) {
  .my-component {
    grid-template-columns: repeat(3, 1fr);
    font-size: 1rem;
  }
}

/* Standard displays */
@media (min-aspect-ratio: 6/5) and (max-aspect-ratio: 3/2) {
  .my-component {
    grid-template-columns: repeat(2, 1fr);
    font-size: 1rem;
  }
}

/* Square displays */
@media (min-aspect-ratio: 9/10) and (max-aspect-ratio: 6/5) {
  .my-component {
    grid-template-columns: repeat(2, 1fr);
    font-size: 0.875rem;
  }
}

/* Tall displays */
@media (max-aspect-ratio: 9/10) {
  .my-component {
    grid-template-columns: 1fr;
    font-size: 0.875rem;
  }
}
```

## Migration from Pixel-Based System

### Option 1: Gradual Migration

You can use both systems simultaneously by enabling aspect ratio mode in the existing `useResponsiveLayout` hook:

```typescript
const {
  currentBreakpoint, // Now returns aspect ratio breakpoint
  isMobile, // Now based on aspect ratio + screen area
  isTablet,
  isDesktop,
  // ... plus all aspect ratio properties
} = useResponsiveLayout({
  useAspectRatio: true, // Enable aspect ratio mode
});
```

### Option 2: Direct Usage

Replace existing responsive components with aspect ratio versions:

```typescript
// Old
import { ResponsiveLayout } from '../components/common/ResponsiveLayout';

// New
import AspectRatioLayout from '../components/layout/AspectRatioLayout';
```

## Benefits

### 1. More Intuitive

- Aspect ratios better represent how content will actually be displayed
- Layouts are more predictable and user-friendly

### 2. Device Agnostic

- Works across different pixel densities and screen sizes
- Provides consistent experiences regardless of device specifications

### 3. Better UX

- Layouts adapt to the actual viewing experience rather than arbitrary pixel counts
- Improves usability and accessibility

### 4. Future-Proof

- More resilient to new device form factors like foldables
- Adapts to ultra-wide monitors and emerging display technologies

### 5. Better for Unusual Aspect Ratios

- Handles ultra-wide gaming monitors (21:9, 32:9)
- Supports foldable devices with changing aspect ratios
- Works well with portrait monitors and unusual display configurations

## Testing

The system includes comprehensive tests for different aspect ratios:

```bash
# Run aspect ratio tests
npm test useAspectRatio.test.tsx
```

Test scenarios include:

- Different aspect ratio classifications
- Orientation changes
- Window resize events
- Custom breakpoint configurations
- Callback functions
- Debouncing behavior

## Best Practices

### 1. Use Semantic Breakpoints

```typescript
// Good
if (isUltraWide) {
  // Ultra-wide specific logic
}

// Better
if (isBreakpoint('ultra-wide')) {
  // Ultra-wide specific logic
}
```

### 2. Provide Fallbacks

```typescript
const fontSize = getAspectRatioStyle(
  aspectRatioStyles.typography.h1.fontSize,
  breakpoint,
  '2rem' // Always provide a fallback
);
```

### 3. Consider Device Type

```typescript
const { isMobile, isTablet, isDesktop } = useAspectRatio();

if (isMobile) {
  // Mobile-specific optimizations
} else if (isTablet) {
  // Tablet-specific optimizations
} else {
  // Desktop-specific optimizations
}
```

### 4. Use Orientation Information

```typescript
const { orientation } = useAspectRatio();

if (orientation === 'portrait') {
  // Portrait-specific layout
} else if (orientation === 'landscape') {
  // Landscape-specific layout
}
```

## Examples

See the `AspectRatioDemo` component for a complete example of the system in action:

```typescript
import AspectRatioDemo from '../components/demo/AspectRatioDemo';

// Add to your routes or pages to see the demo
<AspectRatioDemo />;
```

## Browser Support

The aspect ratio-based responsive system requires modern browser support for:

- CSS `aspect-ratio` media queries
- `window.innerWidth` and `window.innerHeight`
- `addEventListener` for resize events

For older browsers, the system falls back to pixel-based breakpoints.

## Performance Considerations

- The system debounces resize events by default (100ms)
- Aspect ratio calculations are memoized
- Event listeners are properly cleaned up
- Performance monitoring is included

## Customization

You can customize the aspect ratio breakpoints and styles:

```typescript
const customBreakpoints = [
  {
    name: 'mobile',
    minRatio: 0,
    maxRatio: 0.8,
    description: 'Mobile devices',
    commonDevices: ['Phones'],
  },
  // ... more breakpoints
];

const { breakpoint } = useAspectRatio({
  breakpoints: customBreakpoints,
});
```

This aspect ratio-based responsive system provides a more intuitive and future-proof approach to responsive design, making your application more adaptable to the diverse range of devices and display configurations available today and in the future.

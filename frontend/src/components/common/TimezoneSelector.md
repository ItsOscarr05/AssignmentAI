# TimezoneSelector Component

A production-ready timezone selector component with automatic location detection and the top 10 most common timezones worldwide.

## Features

- **Automatic Detection**: Automatically detects user's timezone based on browser location and geolocation
- **Top 10 Common Timezones**: Includes the most frequently used timezones around the world
- **Extended Options**: Optional extended list with additional timezone choices
- **Real-time Display**: Shows current time in the selected timezone
- **Internationalization**: Fully translated with support for multiple languages
- **Accessibility**: Built with accessibility best practices
- **Responsive Design**: Works across all device sizes

## Top 10 Most Common Timezones

1. **Eastern Time (ET)** - America/New_York - UTC-5/UTC-4
2. **Central Time (CT)** - America/Chicago - UTC-6/UTC-5
3. **Mountain Time (MT)** - America/Denver - UTC-7/UTC-6
4. **Pacific Time (PT)** - America/Los_Angeles - UTC-8/UTC-7
5. **Greenwich Mean Time (GMT)** - Europe/London - UTC+0/UTC+1
6. **Central European Time (CET)** - Europe/Paris - UTC+1/UTC+2
7. **Japan Standard Time (JST)** - Asia/Tokyo - UTC+9
8. **China Standard Time (CST)** - Asia/Shanghai - UTC+8
9. **India Standard Time (IST)** - Asia/Kolkata - UTC+5:30
10. **Australian Eastern Time (AET)** - Australia/Sydney - UTC+10/UTC+11

## Usage

```tsx
import TimezoneSelector from '../components/common/TimezoneSelector';

// Basic usage
<TimezoneSelector
  value={timezone}
  onChange={setTimezone}
  label="Timezone"
/>

// With all options
<TimezoneSelector
  value={timezone}
  onChange={setTimezone}
  label="Timezone"
  showDetection={true}
  showExtended={false}
  fullWidth={true}
  size="medium"
  disabled={false}
/>
```

## Props

| Prop            | Type                         | Default      | Description                                  |
| --------------- | ---------------------------- | ------------ | -------------------------------------------- |
| `value`         | `string`                     | -            | Current timezone value (required)            |
| `onChange`      | `(timezone: string) => void` | -            | Callback when timezone changes (required)    |
| `label`         | `string`                     | `'Timezone'` | Label for the select field                   |
| `showDetection` | `boolean`                    | `true`       | Whether to show automatic detection          |
| `showExtended`  | `boolean`                    | `false`      | Whether to show extended timezone options    |
| `fullWidth`     | `boolean`                    | `true`       | Whether the component should take full width |
| `size`          | `'small' \| 'medium'`        | `'medium'`   | Size of the select field                     |
| `disabled`      | `boolean`                    | `false`      | Whether the component is disabled            |

## Automatic Detection

The component automatically detects the user's timezone using:

1. **Browser API**: Uses `Intl.DateTimeFormat().resolvedOptions().timeZone`
2. **Geolocation**: Falls back to browser geolocation API
3. **Timezone API**: Uses coordinates to determine timezone (when available)

## Localization

The component supports multiple languages through the translation system:

- English: "Detect Timezone", "Detecting...", etc.
- Spanish: "Detectar zona horaria", "Detectando...", etc.

## Integration

The component is already integrated into:

- **Settings Page**: Main application settings
- **User Preferences**: User preference management
- **Settings Component**: Reusable settings component

## Dependencies

- Material-UI components
- Custom timezone utilities (`useTimezone` hook)
- Translation system (`useTranslation` hook)
- React hooks for state management

## Browser Support

- Modern browsers with ES6+ support
- Geolocation API support (optional)
- Intl API support (required for timezone detection)

## Performance

- Lazy loading of extended timezone options
- Efficient timezone detection with fallbacks
- Minimal re-renders with proper React optimization

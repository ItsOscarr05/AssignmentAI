# Ad Popup System for Free Users

## Overview

The ad popup system displays **two types of popups** to free users:

1. **Upgrade Popups** - Promotional messages encouraging upgrades to paid plans (every 10 minutes)
2. **AdSense Popups** - Real third-party advertisements from Google AdSense (every 20 minutes)

Both popup types are:

- ✅ **Non-intrusive** - Appear as modal dialogs, not blocking content
- ✅ **Smart timing** - Offset from each other to avoid showing simultaneously
- ✅ **Respectful** - Include "Remind me later" options
- ✅ **Free-user only** - Never shown to paid users

## Components

### 1. AdPopup Component (`frontend/src/components/ads/AdPopup.tsx`)

**Upgrade promotion popup** shown every 10 minutes to encourage paid subscriptions.

**Features:**

- **Upgrade benefits**: Higher token limits, premium AI models, priority processing, advanced features
- **Pricing information**: Starting at $5.99/month
- **Call-to-action buttons**:
  - "View Plans" - Redirects to `/price-plan`
  - "Remind Me Later" - Delays next popup for 30 minutes
- Uses project's signature deep red color (#d32f2f)
- Animated shimmer effect on border
- Responsive grid layout
- Close button in top-right corner

### 1.5. AdSensePopup Component (`frontend/src/components/ads/AdSensePopup.tsx`)

**Real advertisement popup** shown every 20 minutes using Google AdSense.

**Features:**

- Displays real ads from Google AdSense network
- Clean, minimal design (no distractions from ad content)
- "Remind me later" link
- Support message: "Ads help us keep AssignmentAI free"
- Requires AdSense approval and configuration (see `ADSENSE_SETUP.md`)
- Only shown to free users
- Separate timing from upgrade popups (offset by 3 minutes)

### 2. useAdPopup Hook (`frontend/src/hooks/useAdPopup.ts`)

**Two specialized hooks** for managing different popup types:

#### **`useAdPopup()`** - Upgrade Popups

Manages upgrade promotion popups (every 10 minutes).

#### **`useAdSensePopup()`** - AdSense Popups

Manages real advertisement popups (every 20 minutes).

**Shared Features:**

- **Free User Detection**: Automatically detects free users based on:
  - Plan ID contains "free" or equals "price_test_free"
  - Token limit is ≤ 100,000
- **Smart Timing**:
  - Separate intervals for each popup type
  - Offset timing to prevent conflicts
  - "Remind Later" delay: 30 minutes
- **Local Storage Tracking** (separate keys per type):
  - `ad_last_shown` / `adsense_last_shown`: Timestamp of last popup
  - `ad_remind_later` / `adsense_remind_later`: Timestamp when user clicked "Remind Later"
- **Subscription Monitoring**: Listens for payment success events to stop showing ads when user upgrades

**Configuration Options:**

```typescript
// Upgrade popups
{
  intervalMinutes: 10,           // Every 10 minutes
  initialDelayMs: 60000,         // 1 minute after login
  remindLaterDelayMinutes: 30,   // Wait after "Remind Later"
  adType: 'upgrade'
}

// AdSense popups
{
  intervalMinutes: 20,           // Every 20 minutes
  initialDelayMs: 180000,        // 3 minutes after login (offset)
  remindLaterDelayMinutes: 30,   // Wait after "Remind Later"
  adType: 'adsense'
}
```

### 3. Integration in Layout (`frontend/src/components/Layout.tsx`)

**Both popup types** are integrated into the main Layout component, ensuring they appear across all pages for logged-in free users.

```typescript
// Upgrade popup (every 10 minutes)
const { showAd: showUpgradeAd, closeAd: closeUpgradeAd } = useAdPopup();

// AdSense popup (every 20 minutes, offset)
const { showAd: showAdSenseAd, closeAd: closeAdSenseAd } = useAdSensePopup();
```

## Usage

### Basic Usage (Already Integrated)

**Both popup types** are automatically active for all free users.

**For upgrade popups:** No additional setup required ✅

**For AdSense popups:** Requires Google AdSense approval and configuration. See **`ADSENSE_SETUP.md`** for detailed instructions.

### Custom Configuration

To customize the ad timing in specific parts of the app:

```typescript
import { useAdPopup } from '@/hooks/useAdPopup';

const MyComponent = () => {
  const { showAd, closeAd } = useAdPopup({
    intervalMinutes: 15, // Show every 15 minutes instead
    initialDelayMs: 120000, // Wait 2 minutes before first ad
    remindLaterDelayMinutes: 45, // Wait 45 minutes after "Remind Later"
  });

  return (
    <>
      {/* Your component content */}
      <AdPopup open={showAd} onClose={closeAd} />
    </>
  );
};
```

## User Experience Flow

### **Timeline for Free Users:**

```
Time   | Event
-------|--------------------------------------------------
0:00   | User logs in
       | Both hooks check subscription (detects free tier)
1:00   | ✨ Upgrade popup #1 appears
3:00   | 💰 AdSense popup #1 appears (if configured)
11:00  | ✨ Upgrade popup #2 appears
23:00  | 💰 AdSense popup #2 appears
31:00  | ✨ Upgrade popup #3 appears
43:00  | 💰 AdSense popup #3 appears
...    | Pattern continues every session
```

### **User Actions:**

**For any popup:**

- **"View Plans" / Close** → Popup closes, reappears after interval
- **"Remind Me Later"** → Popup closes, waits 30 minutes before reappearing
- **X button** → Same as close

### **After User Upgrades:**

- System detects subscription change via `payment-success` event
- **Both popup types stop immediately**
- No additional action required

## Technical Details

### Free User Detection Logic

```typescript
const isFree = planId.includes('free') || planId === 'price_test_free' || tokenLimit <= 100000;
```

### Local Storage Keys

**Upgrade Popups:**

- `ad_last_shown`: Number (timestamp in ms)
- `ad_remind_later`: Number (timestamp in ms)

**AdSense Popups:**

- `adsense_last_shown`: Number (timestamp in ms)
- `adsense_remind_later`: Number (timestamp in ms)

Each popup type tracks its timing independently to prevent conflicts.

### Event Listeners

- `payment-success`: Triggers subscription recheck

## Customization

### Changing Ad Frequency

Edit the default configuration in `useAdPopup.ts`:

```typescript
const DEFAULT_CONFIG: AdPopupConfig = {
  intervalMinutes: 10, // Change this
  initialDelayMs: 60000, // And this
  remindLaterDelayMinutes: 30, // And this
};
```

### Modifying Ad Content

Edit the `upgradeFeatures` array in `AdPopup.tsx` to change:

- Feature names
- Icons
- Descriptions
- Highlight badges

### Styling Changes

The component uses theme-aware styling. To change colors:

```typescript
const redColor = theme.palette.mode === 'dark' ? '#d32f2f' : '#d32f2f';
```

## Testing

### Manual Testing Checklist

1. ✅ Log in as a free user
2. ✅ Wait 1 minute - ad should appear
3. ✅ Click "Remind Me Later" - ad should close
4. ✅ Wait 30 minutes - ad should reappear
5. ✅ Close ad normally - wait 10 minutes - ad should reappear
6. ✅ Upgrade to paid plan - ads should stop
7. ✅ Refresh page - timing should persist
8. ✅ Log in as paid user - ads should never appear

### Console Logging

The system includes debug logging. Check browser console for:

- `[AdPopup] User plan check:`
- `[AdPopup] Displaying ad`
- `[AdPopup] Closing ad`
- `[AdPopup] Skipping ad - [reason]`
- `[AdPopup] Subscription updated, rechecking plan`

## Deployment Considerations

1. **Environment Variables**: Ensure Stripe price IDs are correctly configured
2. **API Endpoints**: Verify `/payments/subscriptions/current` is accessible
3. **Performance**: Ad popup uses minimal resources (timers only)
4. **Analytics**: Consider adding tracking for ad interactions (not currently implemented)

## Future Enhancements

Potential improvements:

- [ ] Add analytics tracking (Google Analytics events)
- [ ] A/B testing for different ad designs
- [ ] Personalized ad content based on usage patterns
- [ ] Video or animated content in ads
- [ ] Multi-step ad carousel
- [ ] "Don't show again for today" option
- [ ] Different ads for different user segments

## Disabling AdSense Popups (Upgrade Popups Only)

If you want to use only upgrade popups without real ads, simply don't add the AdSense script to `index.html`. The AdSensePopup component will still render but won't show any ads.

**Or** remove it entirely from `Layout.tsx`:

```typescript
// Comment out or remove these lines:
// const { showAd: showAdSenseAd, closeAd: closeAdSenseAd } = useAdSensePopup();
// <AdSensePopup open={showAdSenseAd} onClose={closeAdSenseAd} />
```

This keeps only the upgrade promotion popups active.

---

## Troubleshooting

**Problem**: Ads showing to paid users

- **Solution**: Check subscription API response, verify plan_id and token_limit values

**Problem**: Ads not showing at all

- **Solution**: Check browser console for errors, verify user is logged in, check localStorage

**Problem**: Timing not working correctly

- **Solution**: Clear localStorage (`ad_last_shown`, `ad_remind_later`), refresh page

**Problem**: Ads persist after upgrade

- **Solution**: Ensure `payment-success` event is being dispatched, check event listener

## Code Quality

- ✅ TypeScript strict mode compatible
- ✅ No linter errors
- ✅ Follows project coding standards
- ✅ Responsive design (mobile-friendly)
- ✅ Theme-aware (dark/light mode)
- ✅ Accessible (keyboard navigation, ARIA labels)
- ✅ Performance optimized (memoized callbacks)

---

**Author**: AssignmentAI Development Team  
**Last Updated**: October 18, 2025  
**Version**: 1.0.0

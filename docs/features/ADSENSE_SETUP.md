# Google AdSense Popup Setup Guide

This guide explains how to integrate Google AdSense popup ads into AssignmentAI for free users.

---

## **Overview**

The system shows **two types of popups** for free users:

1. **Upgrade Popups** (every 10 minutes) - Promote paid plans
2. **AdSense Popups** (every 20 minutes) - Show real ads from Google AdSense

Both popups are:
- ✅ Non-intrusive (appear as modals, not blocking content)
- ✅ Smart timing (offset from each other)
- ✅ Respectful ("Remind me later" option)
- ✅ Only shown to free users

---

## **Prerequisites**

### **1. Get Google AdSense Approval**

**Before implementing:**
1. Go to [google.com/adsense](https://www.google.com/adsense)
2. Sign up with your website domain
3. Submit for review (takes 1-2 weeks)
4. Once approved, you'll get:
   - **Publisher ID**: `ca-pub-1234567890123456`
   - **Ad Unit IDs**: Created in AdSense dashboard

**Requirements for approval:**
- Original content
- Sufficient traffic (1000+ monthly visitors recommended)
- Domain ownership verification
- Compliance with AdSense policies

---

## **Installation Steps**

### **Step 1: Add AdSense Script to HTML**

Add the following script tag to `frontend/index.html` in the `<head>` section:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AssignmentAI</title>
    
    <!-- Google AdSense -->
    <script 
      async 
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
      crossorigin="anonymous">
    </script>
    <!-- Replace XXXXXXXXXXXXXXXX with your actual Publisher ID -->
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Replace** `ca-pub-XXXXXXXXXXXXXXXX` with your actual Publisher ID from AdSense.

---

### **Step 2: Create Ad Unit in AdSense Dashboard**

1. Log into [AdSense Dashboard](https://www.google.com/adsense)
2. Go to **Ads** → **Overview** → **By ad unit**
3. Click **"+ New ad unit"**
4. Choose **"Display ads"**
5. Configure:
   - **Name**: "AssignmentAI Popup Ad"
   - **Size**: Responsive
   - **Ad type**: Display
6. Click **"Create"**
7. Copy the **Ad Slot ID** (e.g., `1234567890`)

---

### **Step 3: Update AdSensePopup Component**

Edit `frontend/src/components/ads/AdSensePopup.tsx`:

```typescript
const AdSensePopup: React.FC<AdSensePopupProps> = ({ 
  open, 
  onClose,
  adClient = 'ca-pub-YOUR_PUBLISHER_ID', // ← Replace with your Publisher ID
  adSlot = 'YOUR_AD_SLOT_ID' // ← Replace with your Ad Slot ID
}) => {
  // ... rest of component
```

**Replace:**
- `ca-pub-YOUR_PUBLISHER_ID` with your actual Publisher ID
- `YOUR_AD_SLOT_ID` with your actual Ad Slot ID

---

### **Step 4: Test the Implementation**

#### **Testing in Development:**

AdSense ads won't show in `localhost` during development. To test:

```typescript
// Temporary test mode in AdSensePopup.tsx
<ins
  className="adsbygoogle"
  style={{ display: 'block', minHeight: '250px' }}
  data-ad-client={adClient}
  data-ad-slot={adSlot}
  data-ad-format="auto"
  data-full-width-responsive="true"
  data-adtest="on" // ← Add this for testing
/>
```

**Or** use a test ad unit:
- Publisher ID: `ca-pub-0000000000000000` (test mode)
- Ad Slot: `0000000000` (test mode)

#### **Testing in Production:**

1. Deploy to your domain
2. Log in as a free user
3. Wait 3 minutes → AdSense popup should appear
4. Check browser console for any errors

---

## **Configuration Options**

### **Change Popup Timing**

Edit `frontend/src/hooks/useAdPopup.ts`:

```typescript
const ADSENSE_CONFIG: AdPopupConfig = {
  intervalMinutes: 20, // ← Change to show every X minutes
  initialDelayMs: 180000, // ← Change to 3 minutes (180000ms)
  remindLaterDelayMinutes: 30, // ← Wait after "Remind Later"
  adType: 'adsense',
};
```

**Recommended settings:**
- **Conservative**: Every 30 minutes
- **Moderate**: Every 20 minutes (current)
- **Aggressive**: Every 15 minutes (may annoy users)

### **Customize Popup Appearance**

Edit `frontend/src/components/ads/AdSensePopup.tsx`:

```typescript
// Change dialog size
<Dialog maxWidth="md"> {/* or "sm", "lg" */}

// Change ad container size
<Box sx={{ minHeight: 250 }}> {/* adjust height */}

// Customize colors
<Typography sx={{ color: theme.palette.text.secondary }}>
```

---

## **How It Works**

### **Popup Schedule for Free Users:**

```
Time     | Event
---------|--------------------------------------------------
0:00     | User logs in
1:00     | Upgrade popup #1 appears
3:00     | AdSense popup #1 appears
11:00    | Upgrade popup #2 appears
23:00    | AdSense popup #2 appears
33:00    | Upgrade popup #3 appears
43:00    | AdSense popup #3 appears
...      | Pattern continues
```

**Key Points:**
- Popups are **offset** to avoid showing both at once
- Each type tracks its own "remind later" timing
- Separate localStorage keys prevent conflicts
- Both stop immediately when user upgrades

### **Storage Keys:**

| Key | Purpose | Example Value |
|-----|---------|---------------|
| `ad_last_shown` | Last upgrade popup time | `1729268400000` |
| `ad_remind_later` | Upgrade popup snooze | `1729268400000` |
| `adsense_last_shown` | Last AdSense popup time | `1729268520000` |
| `adsense_remind_later` | AdSense popup snooze | `1729268520000` |

---

## **Revenue Expectations**

### **Estimated Earnings:**

| Metric | Value |
|--------|-------|
| Free users | 1,000/month |
| Avg page views per user | 50/month |
| Total impressions | 50,000/month |
| AdSense RPM | $3-7 |
| **Monthly revenue** | **$150-350** |

### **Coverage of API Costs:**

| Item | Monthly Cost |
|------|--------------|
| API usage (100K tokens avg) | $40 |
| Server bandwidth | $2 |
| **Total cost** | **$42** |
| **AdSense revenue** | **$150-350** |
| **Net profit** | **+$108-308** |

✅ **AdSense covers 3-8x your API costs!**

---

## **Best Practices**

### **✅ DO:**
- Keep popup frequency reasonable (15-20 min minimum)
- Provide "Remind Later" option
- Show supportive message ("Ads keep AssignmentAI free")
- Only show to free users
- Stop ads immediately after upgrade
- Respect GDPR/cookie consent requirements

### **❌ DON'T:**
- Show popups too frequently (< 10 minutes)
- Block critical functionality
- Show multiple ads at once
- Ignore ad blocker users
- Violate AdSense policies

---

## **Compliance & Legal**

### **Privacy Policy Requirements:**

Add to your Privacy Policy:

```markdown
## Advertising

We use Google AdSense to display advertisements to free users. 
Google uses cookies to serve ads based on your prior visits to 
our website or other websites. You may opt out of personalized 
advertising by visiting Google's Ads Settings.

Third-party vendors, including Google, use cookies to serve ads 
based on a user's prior visits to your website or other websites.
```

### **Cookie Consent (GDPR):**

If serving EU users, you **must** get consent before showing ads:

```typescript
// Example: Check consent before showing ads
const [hasConsent, setHasConsent] = useState(false);

useEffect(() => {
  const consent = localStorage.getItem('cookie_consent');
  setHasConsent(consent === 'accepted');
}, []);

// Only use AdSense hook if consent given
const { showAd, closeAd } = hasConsent ? useAdSensePopup() : { showAd: false, closeAd: () => {} };
```

---

## **Troubleshooting**

### **Problem: Ads not showing**

**Solutions:**
1. Check browser console for errors
2. Verify Publisher ID is correct
3. Ensure AdSense script is loaded in `index.html`
4. Check if user is logged in as free user
5. Clear localStorage and test again
6. Disable ad blocker
7. Make sure site is approved in AdSense

### **Problem: "Ad client is not approved" error**

**Solution:**
- Your AdSense account may still be under review
- Use test mode: `data-adtest="on"`
- Wait for AdSense approval email

### **Problem: Blank ad space**

**Solution:**
- AdSense needs time to fill ads (24-48 hours after approval)
- Try different ad sizes
- Check if your content meets AdSense policies

### **Problem: Both popups show at same time**

**Solution:**
- Check localStorage is working
- Verify timing offsets in config
- Clear `ad_last_shown` and `adsense_last_shown` keys

---

## **Monitoring & Analytics**

### **AdSense Dashboard:**
Track performance at: https://www.google.com/adsense/reports

**Key metrics:**
- Page RPM (Revenue Per Mille)
- Click-through rate (CTR)
- Earnings
- Impressions

### **Console Logging:**

Check browser console for debug info:
```
[AdPopup:adsense] User plan check: {planId: "price_test_free", ...}
[AdPopup:adsense] Displaying ad
[AdPopup:adsense] Closing ad
[AdPopup:adsense] Skipping ad - remind later active
```

---

## **Alternative: Disable AdSense Popups**

If you decide not to use AdSense popups and only want upgrade popups:

**In `Layout.tsx`:**
```typescript
// Comment out or remove these lines:
// const { showAd: showAdSenseAd, closeAd: closeAdSenseAd } = useAdSensePopup();
// <AdSensePopup open={showAdSenseAd} onClose={closeAdSenseAd} />
```

This keeps only the upgrade promotion popups active.

---

## **Summary**

**Setup time:** ~30 minutes (after AdSense approval)

**Benefits:**
- ✅ Monetize free users
- ✅ Cover API costs 3-8x over
- ✅ Non-intrusive popups
- ✅ Automatic timing management
- ✅ Easy to configure

**Next steps:**
1. Get AdSense approval
2. Add script to `index.html`
3. Replace Publisher ID and Ad Slot ID
4. Deploy and test
5. Monitor revenue in AdSense dashboard

---

**Questions or issues?** Check the troubleshooting section or AdSense support.

**Last updated:** October 18, 2025


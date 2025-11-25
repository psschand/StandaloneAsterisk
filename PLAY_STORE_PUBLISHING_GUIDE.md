# Google Play Store Publishing Guide - CallCenter PWA

This guide will walk you through publishing your Progressive Web App (PWA) to the Google Play Store using **PWABuilder.com** - a simple web-based tool.

## Prerequisites

1. **Google Play Developer Account** ($25 one-time fee)
   - Sign up at: https://play.google.com/console
   
2. **Domain with HTTPS**
   - Your PWA must be hosted on HTTPS
   - Domain: `app.soham.top` ✅

3. **PWA Requirements**
   - Valid `manifest.json` ✅
   - Service Worker registered ✅
   - Icons (192x192 and 512x512 minimum) ✅
   - HTTPS enabled ✅

---

## Step 1: Use PWABuilder.com

### 1.1 Visit PWABuilder

Go to: **https://www.pwabuilder.com/**

### 1.2 Enter Your PWA URL

1. Enter: `https://app.soham.top`
2. Click **"Start"**
3. Wait for it to analyze your PWA (30-60 seconds)

### 1.3 Review PWA Score

PWABuilder will show your PWA score and any issues. Your app should pass all checks since it's already configured.

### 1.4 Package for Android

1. Click **"Package for Stores"** button
2. Select **"Android"** option
3. Choose **"Google Play Store"** (generates `.aab` file)

### 1.5 Configure Android Settings

Fill in the form:

**App Information:**
- **Package ID**: `com.soham.callcenter`
- **App name**: `CallCenter Omnichannel Platform`
- **Launcher name**: `CallCenter`
- **App version**: `1` (version code)
- **App version name**: `1.0.0`

**Display:**
- **Theme color**: `#4f46e5`
- **Background color**: `#ffffff`
- **Display mode**: `standalone`

**Signing Key:**
- **Option**: Generate new signing key
- PWABuilder will create one for you
- **Download and save it securely!**

**Advanced (Optional):**
- Enable notifications: ✅
- Location delegation: ❌ (unless needed)
- Play billing: ❌

### 1.6 Generate Package

1. Click **"Generate"** or **"Download"**
2. PWABuilder will create your Android package
3. Download:
   - `.aab` file (for Play Store upload)
   - Signing key file (KEEP THIS SAFE!)
   - `assetlinks.json` file

---

## Step 2: Configure Digital Asset Links

For your app to work properly, you need to verify domain ownership.

### 2.1 Get Asset Links File

PWABuilder provides an `assetlinks.json` file in the download.

### 2.2 Deploy Asset Links

Upload the file to your domain so it's accessible at:
```
https://app.soham.top/.well-known/assetlinks.json
```

**How to deploy:**

```bash
# Copy the file to frontend public directory
mkdir -p frontend/public/.well-known
cp assetlinks.json frontend/public/.well-known/

# Rebuild and deploy frontend
docker compose build frontend
docker compose up -d frontend
```

### 2.3 Verify Asset Links

Test that it's accessible:
```bash
curl https://app.soham.top/.well-known/assetlinks.json
```

Should return JSON with your package name and SHA256 fingerprint.

---

## Step 3: Prepare Play Store Assets

Before uploading, prepare these assets:

### Required Assets

1. **App Icon** (512x512 PNG)
   - High resolution, no transparency
   - Use your PWA icon or create a branded version

2. **Feature Graphic** (1024x500 PNG)
   - Banner for Play Store listing
   - Can be simple: app name + tagline + background

3. **Screenshots** (At least 2)
   - Phone screenshots: 1080x1920 or 1080x2340
   - Take screenshots of:
     - Login/Dashboard
     - Active calls screen
     - Live chat interface
     - Any key features

4. **Descriptions**
   - **Short description** (80 chars max):
     ```
     Complete omnichannel platform for call centers - voice, chat & tickets
     ```
   
   - **Full description** (4000 chars max):
     ```
     CallCenter Omnichannel Platform

     A complete cloud-based communication solution for modern call centers and customer service teams.

     KEY FEATURES:
     • Voice Calls - Make and receive calls with advanced routing
     • Live Chat - Real-time chat support with your customers
     • Ticket Management - Track and resolve customer issues
     • Multi-tenant Support - Manage multiple organizations
     • Real-time Dashboard - Monitor active calls and chats
     • Queue Management - Distribute calls efficiently
     • Call Recording - Record and review conversations
     • Agent Management - Control agent availability and status

     PERFECT FOR:
     • Call centers
     • Customer support teams
     • Help desks
     • Sales teams
     • Remote teams

     REQUIREMENTS:
     • Active account on app.soham.top
     • Internet connection
     
     Contact us for enterprise solutions and custom integrations.
     ```

5. **Privacy Policy URL**
   - Create a privacy policy page
   - Host at: `https://app.soham.top/privacy`
   - Or use a privacy policy generator

6. **Category**: Business or Communication

---

## Step 4: Upload to Google Play Console

### 4.1 Create New App

1. Go to: https://play.google.com/console
2. Click **"Create app"**
3. Fill in:
   - **App name**: CallCenter Omnichannel Platform
   - **Default language**: English (US)
   - **App or game**: App
   - **Free or paid**: Free
4. Accept declarations and click **"Create app"**

### 4.2 Complete Store Listing

Navigate to: **Store presence** → **Main store listing**

Fill in:
- **App name**: CallCenter Omnichannel Platform
- **Short description**: (from Step 3)
- **Full description**: (from Step 3)
- **App icon**: Upload 512x512 PNG
- **Feature graphic**: Upload 1024x500 PNG
- **Phone screenshots**: Upload at least 2
- **App category**: Business
- **Email**: Your support email
- **Privacy policy**: URL to your privacy policy

Click **"Save"**

### 4.3 Set Up App Access

Navigate to: **App access**

- Select: **"All or some functionality is restricted"**
- Provide test account:
  ```
  Email: admin@callcenter.com
  Password: Password123!
  ```
- Add instructions if needed

### 4.4 Complete Content Rating

Navigate to: **Content rating**

1. Click **"Start questionnaire"**
2. Select **"Business & productivity"** category
3. Answer questions (typically all "No" for business apps):
   - Violence: No
   - Sexual content: No
   - Language: No
   - Controlled substances: No
   - Gambling: No
4. Save and submit

### 4.5 Target Audience

Navigate to: **Target audience and content**

- **Age group**: 18 and over (or 13+ if appropriate)
- **Store presence**: Available
- **Ads**: Select if you show ads (probably No)

### 4.6 Data Safety

Navigate to: **Data safety**

Complete the form about what data you collect:
- User account info: Yes
- User communications: Yes (calls, chats)
- Explain how data is used
- Data security measures
- Data sharing practices

### 4.7 Upload App Bundle

Navigate to: **Production** → **Releases**

1. Click **"Create new release"**
2. Upload your `.aab` file from PWABuilder
3. Release notes:
   ```
   Initial release

   Features:
   - Voice call management
   - Live chat support  
   - Ticket system
   - Real-time dashboard
   - Multi-tenant architecture
   - Queue management
   ```
4. Click **"Save"** and **"Review release"**

### 4.8 Select Countries

Navigate to: **Production** → **Countries / regions**

- Select countries where you want to publish
- Recommended: Start with your primary market
- Can expand later

### 4.9 Submit for Review

1. Review the dashboard - all items should have ✅
2. Click **"Send X items for review"** (if any required items remain)
3. Once all items are approved, go to Production
4. Click **"Start rollout to Production"**

---

## Step 5: Post-Submission

### Timeline

- **Initial review**: 1-7 days (typically 2-3 days)
- You'll receive email updates on review status
- Check Play Console for any requested changes

### After Approval

Your app will be live on Google Play Store!

**Monitor:**
- Installs and active users
- Crash reports (if any)
- User reviews and ratings
- Performance metrics

**Respond to:**
- User reviews (especially negative ones)
- Crash reports
- Feature requests

---

## Step 6: Future Updates

When you need to update your app:

### Update Process

1. Go back to **PWABuilder.com**
2. Enter `https://app.soham.top` again
3. Generate new package with:
   - **Incremented version code**: `2`, `3`, `4`...
   - **Version name**: `1.1.0`, `1.2.0`, etc.
   - **Same package ID**: `com.soham.callcenter`
   - **Upload your existing signing key** (from first release)

4. Upload to Play Console:
   - Production → Create new release
   - Upload new `.aab`
   - Add release notes
   - Submit

**⚠️ IMPORTANT**: Always use the same signing key for all updates! Keep it backed up securely.

---

## Troubleshooting

### App Shows "Not Verified" Warning

**Cause**: Digital Asset Links not verified yet

**Solution**: 
- Wait 24-48 hours for Google to verify
- Ensure `assetlinks.json` is accessible
- Clear app data and reinstall

### Review Rejected

**Common reasons**:
- Missing privacy policy
- Incomplete store listing
- Test credentials don't work
- Content rating incomplete

**Solution**: Address the issues mentioned in rejection email and resubmit

### App Crashes on Launch

**Cause**: Usually PWA configuration issues

**Solution**:
- Test PWA in mobile Chrome first
- Check service worker is registered
- Verify manifest.json is valid
- Check browser console for errors

---

## Important Information

### Your App Details

- **Package ID**: `com.soham.callcenter`
- **Domain**: `app.soham.top`
- **Asset Links**: `https://app.soham.top/.well-known/assetlinks.json`

### Security

- Keep your signing key safe (downloaded from PWABuilder)
- Store in encrypted backup
- Never share publicly
- You'll need it for every update

---

## Quick Checklist

Before submitting:

- [ ] PWA is live and working at `https://app.soham.top`
- [ ] Go to PWABuilder.com and generate `.aab` file
- [ ] Download signing key and store securely
- [ ] Deploy `assetlinks.json` to domain
- [ ] Play Store account created ($25 paid)
- [ ] App icon (512x512) ready
- [ ] Feature graphic (1024x500) ready
- [ ] At least 2 screenshots ready
- [ ] Short description written
- [ ] Full description written
- [ ] Privacy policy URL ready
- [ ] Test credentials work (admin@callcenter.com / Password123!)
- [ ] All Play Console sections completed
- [ ] Countries selected
- [ ] Content rating completed
- [ ] Data safety form filled

---

## Resources

- **PWABuilder**: https://www.pwabuilder.com/
- **Play Console**: https://play.google.com/console
- **PWA Checklist**: https://web.dev/pwa-checklist/
- **Digital Asset Links**: https://developers.google.com/digital-asset-links
- **Store Listing Guidelines**: https://support.google.com/googleplay/android-developer/answer/9859455

---

**Good luck with your Play Store launch! 🚀**

# NOVA Browser

An iPhone browser built with React Native, Expo, WebKit/WKWebView and a native Swift media module.

**Target OS: iOS 16.0 and later, including iOS 16.7.16.** Development is supported on Windows 11. GitHub Actions uses hosted macOS runners to compile the iOS Simulator build; EAS cloud builds are used for signed iPhone builds.

See [docs/FEATURE_STATUS.md](docs/FEATURE_STATUS.md) for the exact implementation state and known limitations.

## What runs where

| Task | Where |
|---|---|
| Edit code, run tests and TypeScript checks | Windows 11 (VS Code / PowerShell) |
| Compile native iOS Simulator build | GitHub Actions hosted macOS runner |
| Produce a signed iPhone build | EAS cloud with Apple signing credentials |
| Test Touch ID, audio, background playback and lock-screen controls | Physical iPhone |

## Requirements

- Node.js 22 LTS, Git, and an Expo account.
- **Apple Developer Program ($99/year)** for EAS internal distribution to a physical iPhone, device registration and development/ad-hoc provisioning.
- An iPhone running iOS 16.0 or later. NOVA's target includes iOS 16.7.16.
- Change `ios.bundleIdentifier` in `app.json` to an identifier you own before creating a signed build.

A free Apple ID does not provide EAS internal device distribution provisioning. The GitHub Actions Simulator compile does not require your Mac or your Apple signing credentials, but it does not produce an installable signed iPhone IPA.

## Windows PowerShell setup

Run these commands from the project folder:

```powershell
.scriptssetup.ps1
npm run typecheck
npm test
eas login
.scriptsegister-device.ps1
.scriptsuild-ios.ps1 -Profile development
```

The EAS build runs on Apple's cloud build infrastructure. After it completes, install the development build using the EAS-provided installation link, then run `npm start` and connect the development client.

## Implemented source features

- Address/search handling and unsafe navigation scheme blocking.
- Six built-in search engines plus custom search engine settings.
- Tab overview, private tabs, duplicate/pin/reopen, tab groups and session restore.
- Bookmarks and browsing history.
- Download event handling, file download into NOVA app storage and iOS share-sheet export.
- Keychain-backed saved logins with Touch ID / Face ID unlock and vault auto-lock when NOVA backgrounds.
- Find in page, reader text extraction and web-based translation.
- Homepage and browser settings.
- Site permission preference records.
- Starter tracker navigation filter and popup new-window preference.
- Per-tab media panel with play, pause, mute and pause-all controls.
- Native AVAudioSession, Now Playing and lock-screen remote-command bridge.

Source implementation does not mean every feature is complete or device-verified. Important limitations are listed below and in the feature-status document.

## Verification

- Core unit tests and TypeScript type-checking run in GitHub Actions.
- A GitHub-hosted macOS workflow generates the iOS project, installs CocoaPods and compiles the iOS Simulator app without signing.
- Simulator compilation is not the same as installing and running on an iPhone.
- Physical-device testing on iOS 16.7.16 is still required for WebKit behavior, Touch ID, downloads, background audio, interruptions and Control Center controls.

## Known limitations

- The iOS Simulator build does not produce an IPA or sign the app for a physical device.
- Downloaded files are saved to NOVA's app storage and exported using the iOS share sheet. Downloads requiring the website's authenticated WebView cookies may fail.
- Passwords can be saved and deleted after biometric authentication, but automatic form detection and autofill are not implemented.
- Site permission preferences are stored, but not every WebKit permission request is intercepted and enforced by NOVA.
- The tracker filter currently blocks matching navigation requests; it is not a full network-level or subresource filter-list engine.
- Some settings remain preferences and are not fully enforced. Full autoplay blocking and per-site rules are not implemented.
- Find-in-page and reader extraction need real-site and device testing.
- Background audio depends on iOS and on each site's behavior. Test every target site using docs/AUDIO_TEST_CHECKLIST.md.
- DRM-protected streams (including some Spotify Web content) may not play; NOVA does not bypass DRM.
- Private tabs use WebView non-persistent storage and are not an anonymity service.
- Alternative browser engines on iOS are only permitted in some regions; NOVA uses WebKit.

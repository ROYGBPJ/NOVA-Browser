# NOVA Browser feature status

Target: **iOS 16.0 and later**, including iOS 16.7.16. Windows 11 is the development environment; iOS compilation and signing are performed by EAS cloud builds. No physical-device test is claimed by this document.

Legend: **Implemented** = source exists; **Partial** = only part of the feature exists; **Not implemented** = no usable feature yet; **Not tested** = not verified on an iPhone.

| Feature | Current status | Important limitation |
|---|---|---|
| URL/search recognition and unsafe-scheme blocking | Implemented; Stage 1 unit tests | Navigation scheme filter is applied to WebView navigation |
| Six built-in search engines and custom engine core | Implemented in core | Engine selection/custom-engine management UI is not complete |
| Tabs, private tabs, reopen closed, session restore | Implemented in core and shell | Tab groups, tab overview, duplicate and pin controls still need UI |
| Private browsing | Partial | Private tabs are excluded from session/history; WebView incognito behavior needs device verification |
| Bookmarks | Partial | Persistent data model, add button, list/filter/delete UI |
| History | Partial | Persistent visit records and clear-history UI; private tabs are excluded |
| Downloads | Partial | iOS WebView download events can create download-list records; file transfer, progress, storage permissions and share/export are not implemented or verified |
| Password manager | Partial | SecureStore Keychain vault and LocalAuthentication helper exist; save/fill/manage UI and biometric testing are not complete |
| Find in page | Not implemented | No find UI or WebView search bridge yet |
| Reader mode | Partial | User-triggered page-text extraction and reader display; article extraction quality and site coverage are untested |
| Translation | Partial | Opens Google's web translation page; no native translation engine |
| Site permissions manager | Partial | Permission data model and list view; it does not yet intercept and enforce each WebView permission prompt |
| Settings | Partial | Homepage, history, popup/tracker toggles, autoplay preference and reader theme controls; several settings are not yet enforced |
| Content blocking | Partial | Starter tracker host list blocks matching WebView navigation requests only; it does not filter all page subresources and is not a full filter-list engine |
| Homepage | Partial | Configurable homepage is used for new tabs; no designed start-page widgets yet |
| Tab groups | Partial | Persistent group data model exists; group management and assignment UI is not complete |
| Media panel / per-tab controls | Not implemented | Stage 1 only has the playing indicator and native lock-screen integration |
| Autoplay controls | Partial | User-gesture preference is connected to WebView; full block mode and per-site rules are not implemented |
| Accessibility and visual polish | Not tested | Requires VoiceOver and physical-device review |
| Native Swift media module | Implemented in source; not compiled | Must pass EAS iOS build and device playback tests |
| Lock screen / Control Center audio | Partial; not tested | Depends on native module, WebKit behavior and iOS background execution |
| DRM services | Not guaranteed | Third-party WKWebView cannot be assumed to support every DRM-protected service or subscription playback |

## Verification record

- Stage 1 core tests: 13 passed in the earlier authoring run.
- New feature-model tests: added to CI; results pending a GitHub Actions run.
- TypeScript: tsconfig.json now includes App.tsx and BrowserPanel.tsx; CI result pending.
- Swift compilation: not performed.
- iOS simulator/device run: not performed.
- IPA: not built or signed yet.

Do not treat a passing TypeScript/unit-test workflow as proof of iOS runtime compatibility. The next required verification is a successful EAS development build followed by installation and testing on an iOS 16.7.16 device.

# NOVA Browser feature status

Target: **iOS 16.0 and later**, including iOS 16.7.16. Windows 11 is the development environment; iOS compilation and signing are performed by EAS cloud builds. No physical-device test is claimed by this document.

Legend: **Implemented** = source exists; **Partial** = only part of the feature exists; **Not implemented** = no usable feature yet; **Not tested** = not verified on an iPhone.

| Feature | Current status | Important limitation |
|---|---|---|
| URL/search recognition and unsafe-scheme blocking | Implemented; unit tested | Navigation scheme filter is applied to WebView navigation |
| Six built-in search engines and custom engine core | Implemented in core | Engine selection/custom-engine management UI is not complete |
| Tabs, private tabs, reopen closed, session restore | Implemented in core and shell | Tab overview, duplicate, pin and tab-group assignment UI now exists; device behavior untested |
| Private browsing | Partial | Private tabs are excluded from session/history; WebView incognito and cookie isolation need device verification |
| Bookmarks | Partial | Persistent data model, add button, list/filter/delete UI |
| History | Partial | Persistent visit records and clear-history UI; private tabs are excluded |
| Downloads | Partial | iOS WebView download events can create download-list records; file transfer, progress, saving to Files and share/export are not implemented |
| Password manager | Partial | Keychain-backed SecureStore, Touch ID/Face ID unlock, save/delete UI and foreground auto-lock; automatic website autofill is not implemented |
| Find in page | Partial | Find UI calls WebKit's window.find; match counts, highlighting controls and device verification are not complete |
| Reader mode | Partial | User-triggered page-text extraction and reader display; article extraction quality and site coverage are untested |
| Translation | Partial | Opens Google's web translation page; no native translation engine |
| Site permissions manager | Partial | Per-site Ask/Allow/Block preferences are stored and displayed; they do not yet intercept and enforce each WebView permission prompt |
| Settings | Partial | Homepage, history, popup/tracker toggles, autoplay preference and reader theme controls exist; popup, Do Not Track and clear-on-exit enforcement is not complete |
| Content blocking | Partial | Starter tracker host list blocks matching WebView navigation requests only; it does not filter all page subresources and is not a full filter-list engine |
| Homepage | Partial | Configurable homepage is used for new tabs; no designed start-page widgets yet |
| Tab groups | Partial | Create groups, assign/remove tabs and show group membership; group editing/deletion and persistence reconciliation need more work |
| Media panel | Partial | Per-tab title/site/state, play/pause, mute and pause-all controls; embedded-player coverage and device behavior untested |
| Autoplay controls | Partial | WebView user-gesture preference is connected; full block mode and per-site rules are not implemented |
| Accessibility and visual polish | Not tested | Requires VoiceOver and physical-device review |
| Native Swift media module | Implemented in source; not compiled | Must pass EAS iOS build and device playback tests |
| Lock screen / Control Center audio | Partial; not tested | Depends on native module, WebKit behavior and iOS background execution |
| DRM services | Not guaranteed | Third-party WKWebView cannot be assumed to support every DRM-protected service or subscription playback |

## Verification record

- Stage 1 core tests: 13 passed in the earlier authoring run.
- GitHub Actions on commit deaa503ce5b4888dd5d8051f946452aa063380c6: TypeScript typecheck passed; all 20 unit tests passed.
- Additional password-vault auto-lock and media-panel changes were committed after that run; their CI run is pending.
- Swift compilation: not performed.
- iOS simulator/device run: not performed.
- IPA: not built or signed yet.

A passing TypeScript/unit-test workflow is not proof of iOS runtime compatibility. The next required verification is a successful EAS development build followed by installation and testing on an iOS 16.7.16 device.

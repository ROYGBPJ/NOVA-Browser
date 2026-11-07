# NOVA Browser feature status

Target: **iOS 16.0 and later**, including iOS 16.7.16. Windows 11 is the development environment. GitHub Actions compiles the iOS Simulator target on hosted macOS; EAS cloud builds are used for signed iPhone builds. No physical-device test is claimed.

Legend: **Implemented** = source exists; **Partial** = only part of the feature exists; **Not implemented** = no usable feature yet; **Not tested** = not verified on an iPhone.

| Feature | Current status | Important limitation |
|---|---|---|
| URL/search recognition and unsafe-scheme blocking | Implemented; unit tested | Unsafe schemes are rejected for navigation |
| Search engines | Implemented | Six built-ins, custom engine add/remove, persistence and selection UI |
| Tabs and session restore | Implemented | Tab overview, duplicate, pin, reopen and tab-group assignment UI; device behavior untested |
| Private browsing | Partial | Private tabs excluded from session/history/bookmarks/download records/password saving/group metadata; WebView incognito and cookie isolation need device verification |
| Bookmarks | Implemented in shell | Add, list, filter and delete; folder management and bookmark import/export not implemented |
| History | Implemented in shell | Persistent visit records and clear-history UI; no advanced search/filter yet |
| Downloads | Partial | WebView download events start a file transfer into NOVA app storage and completed files can be shared/exported; progress/resume and authenticated WebView cookies are not handled |
| Password manager | Partial | Keychain-backed SecureStore, Touch ID/Face ID unlock, save/delete UI and foreground auto-lock; automatic website form detection/autofill is not implemented |
| Find in page | Partial | Search UI uses WebKit window.find; match counts, robust highlighting and device verification are not complete |
| Reader mode | Partial | User-triggered page-text extraction and reader display; extraction quality/site coverage untested |
| Translation | Partial | Opens Google's web translation page; no native translation engine |
| Site permissions manager | Partial | Per-site Ask/Allow/Block preferences are stored and displayed; iOS/WebKit permission prompts are not intercepted and enforced by these preferences |
| Settings | Partial | Homepage, search engine, autoplay preference, history, popup preference, tracker preference, reader theme, clear-on-background history/permission records; some controls are preferences rather than full system enforcement |
| Content blocking | Partial | Starter tracker host list blocks matching WebView navigation requests only; page subresources are not comprehensively filtered |
| Homepage | Partial | Configurable homepage opens in new tabs; no custom start-page dashboard/widgets yet |
| Tab groups | Partial | Create groups, assign/remove tabs and show membership; group editing/deletion and stale membership cleanup need more work |
| Media panel | Partial | Per-tab title/site/state, play/pause, mute and pause-all controls; embedded-player coverage and device behavior untested |
| Autoplay controls | Partial | WebView user-gesture preference is connected; full block mode and per-site rules are not implemented |
| Accessibility and visual polish | Not tested | Requires VoiceOver and physical-device review |
| Native Swift media module | Implemented and compiled in hosted macOS CI | No physical-device audio session/lock-screen test yet |
| Lock screen / Control Center audio | Partial; not device-tested | Depends on native module, WebKit behavior and iOS background execution |
| DRM services | Not guaranteed | Third-party WKWebView cannot be assumed to support every DRM-protected service or subscription playback |

## Verification record

- GitHub Actions on the current commit e1dc3e555a8e61a98e7e2e0d9ff506f1e7007551: TypeScript typecheck passed and all 21 unit tests passed.
- Hosted macOS GitHub Actions run [42423267895](https://github.com/ROYGBPJ/NOVA-Browser/actions/runs/42423267895) successfully generated the native iOS project, installed CocoaPods and compiled the iOS Simulator target without signing. This included the Swift media module and the latest download/search-engine dependencies.
- The CI job compiled the simulator target; it did not launch the app in an iOS Simulator.
- No IPA has been produced or signed.
- No physical iPhone has been used for testing.

A simulator compile does not prove runtime behavior on an iPhone. The remaining release gate is a green CI run for the current commit, then a signed EAS build and physical-device testing on iOS 16.7.16.

# NOVA audio test checklist (physical iPhone required)

Result values: PASS / FAIL / NOT TESTED / NOT SUPPORTED. Record the reason for every FAIL.
Status below is the true current state: nothing has been run on a device yet.

| # | Test | Result | Notes |
|---|------|--------|-------|
| 1 | Audio from an ordinary HTML5 site | NOT TESTED | |
| 2 | HTML5 video with sound | NOT TESTED | |
| 3 | YouTube | NOT TESTED | Background playback on youtube.com may be restricted by the site |
| 4 | YouTube Music | NOT TESTED | Subscription/site policy may limit background play |
| 5 | Spotify Web Player | NOT TESTED | Uses Widevine DRM; WKWebView may not support it. Expect possible NOT SUPPORTED |
| 6 | SoundCloud | NOT TESTED | |
| 7 | Online radio station | NOT TESTED | |
| 8 | Switch tabs while playing | NOT TESTED | WebViews stay mounted |
| 9 | Navigate to homepage while playing | NOT TESTED | |
| 10 | Minimize NOVA | NOT TESTED | Needs UIBackgroundModes=audio + .playback session |
| 11 | Lock the iPhone | NOT TESTED | |
| 12 | Control Center | NOT TESTED | |
| 13 | Lock-screen controls | NOT TESTED | next/previous are disabled by design |
| 14 | Connect Bluetooth headphones | NOT TESTED | |
| 15 | Disconnect Bluetooth headphones | NOT TESTED | Route-change event is forwarded; pause handling not yet wired in App.tsx |
| 16 | Audio interruption (call/Siri/alarm) | NOT TESTED | Event forwarded; resume policy not yet wired |
| 17 | Return to NOVA | NOT TESTED | |
| 18 | Close the active audio tab | NOT TESTED | |
| 19 | Stop all audio | NOT TESTED | No UI button yet |
| 20 | Reopen browser | NOT TESTED | |

BASTIEN Autoplay Fix 2 — September 20, 2026

DEPLOY: Extract this ZIP and upload the entire contents (index.html at hosting root).
A version query is added to the music JS/CSS references on four pages to defeat stale browser caches.

WHAT CHANGED
- YouTube video is displayed at 200x200 above the compact music dock, not hidden offscreen.
  YouTube requires visible embeds of this size for autoplay. This necessarily changes the music area only.
- The player requests autoplay=1, sound on, start=0, and falls back to muted
  playback if the browser blocks sound. If playback itself is blocked, the
  buttons remain available for a real click, and errors show a YouTube link.
- Only one player per page; no synthetic gestures or browser permission bypasses.
- Song: Malcolm Todd — Chest Pain (I Love), YouTube id dTS_aNfpbIM.
- Chrome and other browsers may block sound autoplay on first visits; no website
  JavaScript can promise sound without a permitted browser/user interaction.

DATA PROTECTION
- Member data and Firebase are NOT touched; no database writes or resets.
- All member/auth/backend JS, member/admin/login content, media, and deploy
  configuration are byte-identical to the previous ZIP. The four HTML changes
  are limited to two music JS/CSS cache-busting query strings per page.
- Runtime access to the live Firebase/KeyAuth/YouTube services was not available;
  on-site playback and live member record completeness are not verified.

Troubleshooting: deploy the entire ZIP, then Ctrl+F5 refresh. Do NOT open
index.html by file://; use your deployed HTTPS URL or START-LOCAL-SERVER.bat.
YouTube can refuse embedding certain videos or may be blocked by networks.

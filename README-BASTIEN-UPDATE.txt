BASTIEN — MUSIC PLAYER & PERFORMANCE UPDATE

Pages: index.html, members.html, login.html, admin.html
- Compact black/white rectangular music player with separate Play/Pause and Mute/Unmute buttons.
- Attempts muted YouTube autoplay at 00:00. If blocked, use the visible Play button.
- Sound can only be enabled via a direct user click, depending on browser policy.
- Music initializes once per document. Standard navigation loads a new HTML page and restarts the music; persistent uninterrupted playback would require changing the site into a single-page application.
- Original Firebase configuration, member CRUD module, KeyAuth module, database rules and route configuration were preserved exactly. No online member data was accessed or reset.
- Optimized background WebP is 83% smaller than the source PNG. The original PNG remains bundled.
- To run locally, use a local HTTP server (for example START-LOCAL-SERVER.bat), not file://. Deploy the full folder including /assets, /css and /js.
- Actual YouTube availability and Firebase/KeyAuth services depend on internet access and their own settings. Browser autoplay with sound cannot be guaranteed.

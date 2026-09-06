(() => {
  'use strict';
  const VIDEO_ID = 'dTS_aNfpbIM';
  const COVER = 'https://i.ytimg.com/vi/dTS_aNfpbIM/hqdefault.jpg';
  const TITLE = 'Chest Pain (I Love)';
  const ARTIST = 'Malcolm Todd';
  const KEY_TIME = 'bastienMusicTime';
  const KEY_MUTED = 'bastienMusicMuted';
  let player = null, ready = false, unlocked = false;

  const dock = document.createElement('div');
  dock.id = 'bastienMusicDock';
  dock.innerHTML = `<div class="cover" style="background-image:url('${COVER}')"></div><div class="meta"><div class="music-title">${TITLE}</div><div class="music-sub">${ARTIST}</div></div><button id="bastienMusicToggle" type="button" aria-label="Mute or unmute">UNMUTE</button><div class="state" id="bastienMusicState">AUTO PLAY (MUTED)</div>`;
  document.body.appendChild(dock);
  const frame = document.createElement('div');
  frame.id = 'bastienMusicFrame';
  document.body.appendChild(frame);
  const btn = dock.querySelector('#bastienMusicToggle');
  const state = dock.querySelector('#bastienMusicState');

  function setMutedUI(v) {
    localStorage.setItem(KEY_MUTED, v ? '1' : '0');
    btn.textContent = v ? 'UNMUTE' : 'MUTE';
    state.textContent = v ? (unlocked ? 'MUTED' : 'CLICK TO UNMUTE') : 'PLAYING';
  }

  function resumeTime() {
    const n = parseFloat(localStorage.getItem(KEY_TIME) || '0');
    return Number.isFinite(n) && n > 2 ? n : 0;
  }

  function saveTime() {
    if (!player || !ready) return;
    try {
      const t = player.getCurrentTime();
      if (typeof t === 'number' && t > 0) {
        localStorage.setItem(KEY_TIME, String(t));
      }
    } catch (_) {}
  }

  window.onYouTubeIframeAPIReady = function () {
    if (player) return;
    player = new YT.Player(frame, {
      width: 1,
      height: 1,
      videoId: VIDEO_ID,
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        loop: 1,
        playlist: VIDEO_ID,
        playsinline: 1,
        rel: 0,
        mute: 1,
        origin: location.origin
      },
      events: {
        onReady(e) {
          ready = true;
          const t = resumeTime();
          if (t > 0) e.target.seekTo(t, true);
          e.target.setVolume(55);
          // Always start muted so autoplay is allowed by browsers
          e.target.mute();
          try {
            e.target.playVideo();
          } catch (_) {}
          setMutedUI(true);
          state.textContent = 'CLICK TO UNMUTE';
        },
        onStateChange(e) {
          if (e.data === YT.PlayerState.PLAYING) {
            state.textContent = e.target.isMuted()
              ? (unlocked ? 'MUTED' : 'CLICK TO UNMUTE')
              : 'PLAYING';
          }
          if (e.data === YT.PlayerState.ENDED) {
            try {
              e.target.playVideo();
            } catch (_) {}
          }
        },
        onError() {
          state.textContent = 'YOUTUBE ERROR';
        }
      }
    });
  };

  // Toggle button (only works after unlock)
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!player || !ready) return;
    try {
      if (player.isMuted()) {
        player.unMute();
        player.setVolume(55);
        player.playVideo();
        setMutedUI(false);
        unlocked = true;
      } else {
        player.mute();
        setMutedUI(true);
      }
    } catch (_) {}
  });

  // First user interaction = force unmute + play (strict)
  const unlock = (ev) => {
    if (unlocked || !player || !ready) return;
    try {
      player.unMute();
      player.setVolume(55);
      player.playVideo();
      unlocked = true;
      setMutedUI(false);
      ['pointerdown', 'keydown', 'touchstart', 'click'].forEach((evt) =>
        window.removeEventListener(evt, unlock)
      );
    } catch (_) {}
  };

  ['pointerdown', 'keydown', 'touchstart', 'click'].forEach((ev) =>
    window.addEventListener(ev, unlock, { passive: true, capture: true })
  );

  setInterval(saveTime, 1500);
  window.addEventListener('pagehide', saveTime, { passive: true });
  window.addEventListener('beforeunload', saveTime, { passive: true });
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saveTime();
  });

  // Load YouTube API only once
  if (!document.querySelector('script[data-bastien-yt-api]')) {
    const api = document.createElement('script');
    api.src = 'https://www.youtube.com/iframe_api';
    api.async = true;
    api.dataset.bastienYtApi = '1';
    document.head.appendChild(api);
  } else if (window.YT && window.YT.Player) {
    window.onYouTubeIframeAPIReady();
  }
})();

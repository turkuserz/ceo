(() => {
  'use strict';

  const VIDEO_ID = 'dTS_aNfpbIM';
  const COVER = 'https://i.ytimg.com/vi/dTS_aNfpbIM/hqdefault.jpg';
  const TITLE = 'Chest Pain (I Love)';
  const ARTIST = 'Malcolm Todd';
  const TIME_KEY = 'bastien_music_time';
  const MUTED_KEY = 'bastien_music_muted';

  let player = null;
  let ready = false;
  let userUnlocked = false;
  let lastSaved = 0;

  // Keep the music player alive across SPA page changes.
  let dock = document.getElementById('bastienMusicDock');
  let frame = document.getElementById('bastienMusicFrame');

  if (!dock) {
    dock = document.createElement('div');
    dock.id = 'bastienMusicDock';
    dock.innerHTML = `
      <div class="cover" style="background-image:url('${COVER}')"></div>
      <div class="meta">
        <div class="music-title">${TITLE}</div>
        <div class="music-sub">${ARTIST}</div>
      </div>
      <button id="bastienMusicToggle" type="button" aria-label="Mute or unmute">MUTE</button>
      <div class="state" id="bastienMusicState">PLAYING</div>
    `;
    document.body.appendChild(dock);
  }

  if (!frame) {
    frame = document.createElement('div');
    frame.id = 'bastienMusicFrame';
    document.body.appendChild(frame);
  }

  const btn = dock.querySelector('#bastienMusicToggle');
  const state = dock.querySelector('#bastienMusicState');

  const setUI = (muted) => {
    btn.textContent = muted ? 'UNMUTE' : 'MUTE';
    state.textContent = muted ? 'MUTED' : 'PLAYING';
  };

  const saveTime = () => {
    if (!player || !ready) return;
    try {
      const t = player.getCurrentTime();
      if (Number.isFinite(t) && t > 0) {
        localStorage.setItem(TIME_KEY, String(t));
        lastSaved = t;
      }
    } catch (_) {}
  };

  const resumePosition = () => {
    const saved = parseFloat(localStorage.getItem(TIME_KEY) || '0');
    return Number.isFinite(saved) && saved > 0 ? saved : 0;
  };

  const playImmediately = (ytPlayer) => {
    try {
      ytPlayer.setVolume(55);

      // Resume where the visitor left off instead of restarting on every page.
      const saved = resumePosition();
      if (saved > 0) ytPlayer.seekTo(saved, true);

      // Autoplay is allowed by browsers only when muted.
      ytPlayer.mute();
      ytPlayer.playVideo();

      const rememberedMuted = localStorage.getItem(MUTED_KEY) === '1';
      if (rememberedMuted) setUI(true);
      else setUI(true);
    } catch (_) {}
  };

  const unlockAudio = () => {
    if (!player || !ready || userUnlocked) return;
    userUnlocked = true;
    localStorage.setItem(MUTED_KEY, '0');
    try {
      player.unMute();
      player.setVolume(55);
      player.playVideo();
      setUI(false);
    } catch (_) {}
  };

  window.onYouTubeIframeAPIReady = function () {
    if (player) return;

    player = new YT.Player(frame, {
      width: 1,
      height: 1,
      videoId: VIDEO_ID,
      playerVars: {
        autoplay: 1,
        start: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        loop: 1,
        playlist: VIDEO_ID,
        playsinline: 1,
        rel: 0,
        origin: location.origin
      },
      events: {
        onReady(e) {
          ready = true;
          playImmediately(e.target);
        },
        onStateChange(e) {
          if (e.data === YT.PlayerState.PLAYING) {
            if (!userUnlocked) e.target.mute();
            setUI(e.target.isMuted());
          }
          if (e.data === YT.PlayerState.ENDED) {
            try {
              e.target.seekTo(0, true);
              e.target.playVideo();
            } catch (_) {}
          }
        },
        onError() {
          state.textContent = 'UNAVAILABLE';
        }
      }
    });
  };

  btn.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!player || !ready) return;

    try {
      if (player.isMuted()) {
        userUnlocked = true;
        localStorage.setItem(MUTED_KEY, '0');
        player.unMute();
        player.setVolume(55);
        player.playVideo();
        setUI(false);
      } else {
        userUnlocked = false;
        localStorage.setItem(MUTED_KEY, '1');
        player.mute();
        setUI(true);
      }
    } catch (_) {}
  });

  // Save playback position so a full reload still resumes smoothly.
  window.addEventListener('pagehide', saveTime);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saveTime();
  });
  window.setInterval(saveTime, 500);

  // Browser policy: first interaction can unlock sound automatically.
  ['pointerdown', 'keydown', 'touchstart'].forEach(type => {
    window.addEventListener(type, unlockAudio, { once: true, passive: true });
  });

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

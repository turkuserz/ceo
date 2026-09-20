/* BASTIEN music dock — one YouTube player per page, no database dependencies. */
(() => {
  'use strict';
  if (document.getElementById('bastienMusicDock')) return;

  const VIDEO_ID = 'dTS_aNfpbIM';
  const COVER = `https://i.ytimg.com/vi/${VIDEO_ID}/hqdefault.jpg`;
  const TITLE = 'Chest Pain (I Love)';
  const ARTIST = 'Malcolm Todd';
  const PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 11 7-11 7V5Z" fill="currentColor" stroke="none"/></svg>';
  const PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/></svg>';
  const SOUND = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5ZM15 9a5 5 0 0 1 0 6M18 6a9 9 0 0 1 0 12"/></svg>';
  const MUTED = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5ZM16 9l5 6m0-6-5 6"/></svg>';

  const dock = document.createElement('section');
  dock.id = 'bastienMusicDock';
  dock.setAttribute('aria-label', 'BASTIEN music player');
  dock.innerHTML = `
    <div class="music-cover" aria-hidden="true"><img src="${COVER}" alt="" loading="lazy" decoding="async"></div>
    <div class="music-meta">
      <span class="music-title" title="${TITLE}">${TITLE}</span>
      <span class="music-artist" title="${ARTIST}">${ARTIST}</span>
    </div>
    <div class="music-actions">
      <button type="button" id="bastienMusicPlay" class="music-control" aria-label="Play music" title="Play music" disabled>${PLAY}</button>
      <button type="button" id="bastienMusicMute" class="music-control" aria-label="Unmute music" title="Unmute music" disabled>${MUTED}</button>
    </div>
    <span class="music-sr-only" id="bastienMusicStatus" role="status" aria-live="polite">Loading music</span>`;
  document.body.appendChild(dock);

  // Keep the iframe measurable for YouTube, but outside the visible layout.
  const frame = document.createElement('div');
  frame.id = 'bastienMusicFrame';
  document.body.appendChild(frame);

  const playButton = dock.querySelector('#bastienMusicPlay');
  const muteButton = dock.querySelector('#bastienMusicMute');
  const status = dock.querySelector('#bastienMusicStatus');
  let player = null;
  let ready = false;
  let playing = false;
  let muted = true;
  let heardPlaying = false;
  let errored = false;

  function announce(message) {
    status.textContent = message;
    dock.title = message;
  }

  function updateControls() {
    playButton.disabled = !ready;
    muteButton.disabled = !ready;
    playButton.innerHTML = playing ? PAUSE : PLAY;
    playButton.setAttribute('aria-label', playing ? 'Pause music' : 'Play music');
    playButton.title = playing ? 'Pause music' : 'Play music';
    muteButton.innerHTML = muted ? MUTED : SOUND;
    muteButton.setAttribute('aria-label', muted ? 'Unmute music' : 'Mute music');
    muteButton.title = muted ? 'Unmute music' : 'Mute music';
    muteButton.setAttribute('aria-pressed', String(!muted));
    dock.dataset.playing = String(playing);
    dock.dataset.muted = String(muted);
  }

  playButton.addEventListener('click', () => {
    if (!ready || !player) return;
    try {
      if (playing) {
        player.pauseVideo();
        playing = false;
        announce('Music paused');
      } else {
        // A real user click also serves as a fallback when autoplay is blocked.
        player.playVideo();
        announce('Starting music');
      }
      updateControls();
    } catch (_) {
      announce('Unable to control playback');
    }
  });

  muteButton.addEventListener('click', () => {
    if (!ready || !player) return;
    try {
      if (muted) {
        player.setVolume(60);
        player.unMute();
        muted = false;
        // Unmuting never seeks, restarts, or silently mutes again.
        if (!playing) player.playVideo();
        announce('Sound on');
      } else {
        player.mute();
        muted = true;
        announce('Sound off');
      }
      updateControls();
    } catch (_) {
      announce('Unable to change volume');
    }
  });

  function initYouTube() {
    if (player || !window.YT || !window.YT.Player) return;
    player = new window.YT.Player('bastienMusicFrame', {
      width: 200,
      height: 200,
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
        mute: 1,
        ...(location.origin !== 'null' ? { origin: location.origin } : {})
      },
      events: {
        onReady(event) {
          ready = true;
          // Browsers generally allow muted autoplay; sound requires a user gesture.
          event.target.mute();
          muted = true;
          event.target.setVolume(60);
          event.target.seekTo(0, true);
          announce('Autoplay starting with sound off');
          updateControls();
          event.target.playVideo();
          window.setTimeout(() => {
            if (ready && !heardPlaying && !errored) {
              playing = false;
              announce('Autoplay blocked. Press Play to start music.');
              updateControls();
            }
          }, 5000);
        },
        onStateChange(event) {
          const states = window.YT.PlayerState;
          if (event.data === states.PLAYING) {
            heardPlaying = true;
            playing = true;
            muted = event.target.isMuted();
            announce(muted ? 'Now playing with sound off' : 'Now playing with sound on');
          } else if (event.data === states.PAUSED) {
            playing = false;
            announce('Music paused');
          } else if (event.data === states.ENDED) {
            playing = false;
            try { event.target.seekTo(0, true); event.target.playVideo(); } catch (_) {}
          }
          updateControls();
        },
        onAutoplayBlocked() {
          playing = false;
          announce('Autoplay blocked. Press Play to start music.');
          updateControls();
        },
        onError() {
          errored = true;
          playing = false;
          announce('YouTube playback unavailable');
          updateControls();
        }
      }
    });
  }

  updateControls();
  // Avoid a second script or player even if this file is included twice.
  if (window.YT && window.YT.Player) {
    initYouTube();
  } else {
    window.onYouTubeIframeAPIReady = initYouTube;
    if (!document.querySelector('script[data-bastien-yt-api]')) {
      const api = document.createElement('script');
      api.src = 'https://www.youtube.com/iframe_api';
      api.async = true;
      api.dataset.bastienYtApi = '1';
      document.head.appendChild(api);
    }
  }
})();

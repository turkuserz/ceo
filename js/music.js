/* BASTIEN music: a single visible YouTube embed, sound-first autoplay and muted fallback.
   This module never reads or writes Firebase, authentication or member data. */
(() => {
  'use strict';
  if (document.getElementById('bastienMusicDock')) return;

  const VIDEO_ID = 'dTS_aNfpbIM';
  const VIDEO_URL = `https://www.youtube.com/watch?v=${VIDEO_ID}`;
  const VOLUME = 65;
  const PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 11 7-11 7V5Z" fill="currentColor" stroke="none"/></svg>';
  const PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/></svg>';
  const SOUND = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5ZM15 9a5 5 0 0 1 0 6M18 6a9 9 0 0 1 0 12"/></svg>';
  const MUTED = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5ZM16 9l5 6m0-6-5 6"/></svg>';

  const dock = document.createElement('section');
  dock.id = 'bastienMusicDock';
  dock.setAttribute('aria-label', 'BASTIEN music player');
  dock.innerHTML = `
    <div class="music-cover" aria-hidden="true"><img src="https://i.ytimg.com/vi/${VIDEO_ID}/hqdefault.jpg" alt="" loading="lazy" decoding="async"></div>
    <div class="music-meta">
      <span class="music-title" title="Chest Pain (I Love)">Chest Pain (I Love)</span>
      <span class="music-artist">Malcolm Todd</span>
      <span class="music-hint" id="bastienMusicHint" hidden></span>
    </div>
    <div class="music-actions">
      <button type="button" id="bastienMusicPlay" class="music-control" aria-label="Play music" title="Play music" disabled>${PLAY}</button>
      <button type="button" id="bastienMusicMute" class="music-control" aria-label="Mute music" title="Mute music" disabled>${SOUND}</button>
    </div>
    <a id="bastienMusicExternal" class="music-external" href="${VIDEO_URL}" target="_blank" rel="noopener noreferrer" hidden>Open on YouTube</a>
    <span class="music-sr-only" id="bastienMusicStatus" role="status" aria-live="polite">Loading YouTube music</span>`;
  document.body.appendChild(dock);

  // YouTube requires a visible player of at least 200 × 200 pixels for autoplay.
  // The API replaces this div with ONE iframe. It must not be offscreen or overlaid.
  const frame = document.createElement('div');
  frame.id = 'bastienMusicFrame';
  document.body.appendChild(frame);

  const playButton = dock.querySelector('#bastienMusicPlay');
  const muteButton = dock.querySelector('#bastienMusicMute');
  const hint = dock.querySelector('#bastienMusicHint');
  const status = dock.querySelector('#bastienMusicStatus');
  const external = dock.querySelector('#bastienMusicExternal');
  let player = null;
  let ready = false;
  let playing = false;
  let muted = false;
  let errored = false;
  let interacted = false;
  let phase = 'sound'; // sound -> muted -> done
  let startTimer = null;
  let scriptTimer = null;

  function announce(message, visible = false) {
    status.textContent = message;
    hint.textContent = visible ? message : '';
    hint.hidden = !visible;
    dock.title = message;
  }
  function updateControls() {
    playButton.disabled = !ready || errored;
    muteButton.disabled = !ready || errored;
    playButton.innerHTML = playing ? PAUSE : PLAY;
    playButton.setAttribute('aria-label', playing ? 'Pause music' : 'Play music');
    playButton.title = playing ? 'Pause music' : 'Play music';
    muteButton.innerHTML = muted ? MUTED : SOUND;
    muteButton.setAttribute('aria-label', muted ? 'Unmute music' : 'Mute music');
    muteButton.title = muted ? 'Unmute music' : 'Mute music';
    muteButton.setAttribute('aria-pressed', String(!muted));
    dock.dataset.playing = String(playing);
    dock.dataset.muted = String(muted);
    dock.dataset.autoplayFallback = String(muted && !interacted);
  }
  function clearStartTimer() {
    if (startTimer !== null) window.clearTimeout(startTimer);
    startTimer = null;
  }
  function playingNow() {
    try { return player.getPlayerState() === window.YT.PlayerState.PLAYING; }
    catch (_) { return playing; }
  }
  function showPlaybackError(message) {
    errored = true;
    playing = false;
    phase = 'done';
    clearStartTimer();
    announce(message, true);
    external.hidden = false;
    updateControls();
  }
  function fallbackMuted() {
    if (!ready || errored || interacted || phase !== 'sound') return;
    // Never silence a sound-first attempt that has already succeeded.
    if (playingNow()) {
      phase = 'done';
      playing = true;
      muted = player.isMuted();
      announce(muted ? 'Playing muted — press speaker for sound' : 'Playing with sound', muted);
      clearStartTimer();
      updateControls();
      return;
    }
    phase = 'muted';
    clearStartTimer();
    try {
      player.mute();
      muted = true;
      announce('Autoplay with sound blocked — trying muted', true);
      updateControls();
      player.playVideo();
      if (phase === 'muted' && !playingNow()) {
        startTimer = window.setTimeout(() => {
          if (!interacted && phase === 'muted' && !playingNow()) {
            phase = 'done';
            playing = false;
            announce('Press Play to start music', true);
            updateControls();
          }
        }, 4000);
      }
    } catch (_) {
      phase = 'done';
      announce('Press Play to start music', true);
      updateControls();
    }
  }

  playButton.addEventListener('click', () => {
    if (!ready || errored || !player) return;
    interacted = true;
    phase = 'done';
    clearStartTimer();
    try {
      if (playingNow()) {
        player.pauseVideo();
        playing = false;
        announce('Music paused');
      } else {
        // Explicit Play is a user gesture. Try sound again after muted fallback.
        player.setVolume(VOLUME);
        player.unMute();
        muted = false;
        player.playVideo();
        announce('Starting music');
      }
      updateControls();
    } catch (_) { announce('Unable to control playback', true); }
  });
  muteButton.addEventListener('click', () => {
    if (!ready || errored || !player) return;
    interacted = true;
    phase = 'done';
    clearStartTimer();
    try {
      if (player.isMuted()) {
        player.setVolume(VOLUME);
        player.unMute();
        muted = false;
        if (!playingNow()) player.playVideo();
        announce('Sound on');
      } else {
        player.mute();
        muted = true;
        announce('Sound off');
      }
      updateControls();
    } catch (_) { announce('Unable to change sound', true); }
  });

  function initYouTube() {
    if (player || !window.YT || !window.YT.Player) return;
    if (scriptTimer !== null) window.clearTimeout(scriptTimer);
    try {
      player = new window.YT.Player('bastienMusicFrame', {
        width: 200,
        height: 200,
        videoId: VIDEO_ID,
        playerVars: {
          autoplay: 1, // Start on page load; browser may disallow sound.
          mute: 0,
          start: 0,
          controls: 1,
          loop: 1,
          playlist: VIDEO_ID,
          playsinline: 1,
          rel: 0,
          ...(location.origin !== 'null' ? { origin: location.origin } : {})
        },
        events: {
          onReady(event) {
            ready = true;
            try {
              const iframe = typeof event.target.getIframe === 'function' ? event.target.getIframe() : document.getElementById('bastienMusicFrame');
              if (iframe) {
                iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
                iframe.setAttribute('title', 'Malcolm Todd — Chest Pain (I Love)');
              }
              event.target.setVolume(VOLUME);
              event.target.unMute();
              muted = false;
              announce('Attempting autoplay with sound');
              updateControls();
              event.target.playVideo();
              if (phase === 'sound' && !interacted) {
                startTimer = window.setTimeout(fallbackMuted, 3000);
              }
            } catch (_) { fallbackMuted(); }
          },
          onStateChange(event) {
            const states = window.YT.PlayerState;
            if (event.data === states.PLAYING) {
              playing = true;
              muted = event.target.isMuted();
              phase = 'done';
              clearStartTimer();
              announce(muted ? 'Playing muted — press speaker for sound' : 'Playing with sound', muted && !interacted);
            } else if (event.data === states.PAUSED) {
              playing = false;
              if (interacted) announce('Music paused');
            } else if (event.data === states.ENDED) {
              playing = false;
              try { event.target.seekTo(0, true); event.target.playVideo(); } catch (_) {}
            }
            updateControls();
          },
          onAutoplayBlocked() {
            if (playingNow()) return;
            if (!interacted && phase === 'sound') {
              if (ready) fallbackMuted();
              // If autoplay was blocked before onReady, onReady will retry sound first.
            } else if (!interacted && phase === 'muted') {
              phase = 'done';
              clearStartTimer();
              announce('Press Play to start music', true);
              updateControls();
            } else {
              announce('Playback blocked — press Play to retry', true);
            }
          },
          onError(event) {
            const code = event && event.data;
            showPlaybackError(code === 100 || code === 101 || code === 150
              ? 'Video cannot play here — open YouTube'
              : 'YouTube playback unavailable');
          }
        }
      });
    } catch (_) { showPlaybackError('Could not initialize YouTube player'); }
  }

  updateControls();
  if (window.YT && window.YT.Player) {
    initYouTube();
  } else {
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previousReady === 'function') previousReady();
      initYouTube();
    };
    if (!document.querySelector('script[data-bastien-yt-api]')) {
      const api = document.createElement('script');
      api.src = 'https://www.youtube.com/iframe_api';
      api.async = true;
      api.dataset.bastienYtApi = '1';
      api.onerror = () => showPlaybackError('YouTube could not load — open YouTube');
      document.head.appendChild(api);
    }
    scriptTimer = window.setTimeout(() => {
      if (!player) showPlaybackError('YouTube could not load — open YouTube');
    }, 12000);
  }
})();

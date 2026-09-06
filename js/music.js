(() => {
  'use strict';

  const VIDEO_ID = 'dTS_aNfpbIM';
  const COVER = 'https://i.ytimg.com/vi/dTS_aNfpbIM/hqdefault.jpg';
  const TITLE = 'Chest Pain (I Love)';
  const ARTIST = 'Malcolm Todd';

  let player = null;
  let ready = false;
  let playTimer = null;

  const dock = document.createElement('div');
  dock.id = 'bastienMusicDock';
  dock.innerHTML = `
    <div class="cover" style="background-image:url('${COVER}')"></div>
    <div class="meta">
      <div class="music-title">${TITLE}</div>
      <div class="music-sub">${ARTIST}</div>
    </div>
    <button id="bastienMusicToggle" type="button" aria-label="Mute or unmute">UNMUTE</button>
    <div class="state" id="bastienMusicState">MUTED</div>
  `;
  document.body.appendChild(dock);

  const frame = document.createElement('div');
  frame.id = 'bastienMusicFrame';
  document.body.appendChild(frame);

  const btn = dock.querySelector('#bastienMusicToggle');
  const state = dock.querySelector('#bastienMusicState');

  const setMutedUI = (muted) => {
    btn.textContent = muted ? 'UNMUTE' : 'MUTE';
    state.textContent = muted ? 'MUTED' : 'PLAYING';
  };

  const startFreshMuted = (ytPlayer) => {
    try {
      ytPlayer.mute();
      ytPlayer.setVolume(55);
      ytPlayer.seekTo(0, true);
      setMutedUI(true);
      clearTimeout(playTimer);
      playTimer = setTimeout(() => {
        try {
          ytPlayer.mute();
          ytPlayer.seekTo(0, true);
          ytPlayer.playVideo();
        } catch (_) {}
      }, 1000);
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
          startFreshMuted(e.target);
        },
        onStateChange(e) {
          if (e.data === YT.PlayerState.PLAYING) {
            setMutedUI(e.target.isMuted());
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
        player.unMute();
        player.setVolume(55);
        setMutedUI(false);
        player.playVideo();
      } else {
        player.mute();
        setMutedUI(true);
      }
    } catch (_) {}
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

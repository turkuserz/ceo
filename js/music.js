(() => {
  'use strict';

  const VIDEO_ID = 'dTS_aNfpbIM';
  const COVER = 'https://i.ytimg.com/vi/dTS_aNfpbIM/hqdefault.jpg';
  const TITLE = 'Chest Pain (I Love)';
  const ARTIST = 'Malcolm Todd';

  let player = null;
  let ready = false;

  const dock = document.createElement('div');
  dock.id = 'bastienMusicDock';
  dock.innerHTML = `
    <div class="cover" style="background-image:url('${COVER}')"></div>
    <div class="meta">
      <div class="music-title">${TITLE}</div>
      <div class="music-sub">${ARTIST}</div>
    </div>
    <button id="bastienMusicToggle" type="button" aria-label="Mute or unmute">UNMUTE</button>
  `;
  document.body.appendChild(dock);

  const frame = document.createElement('div');
  frame.id = 'bastienMusicFrame';
  document.body.appendChild(frame);

  const btn = dock.querySelector('#bastienMusicToggle');

  const updateButton = (muted) => {
    btn.textContent = muted ? 'UNMUTE' : 'MUTE';
    btn.setAttribute('aria-label', muted ? 'Unmute music' : 'Mute music');
  };

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
        start: 0,
        mute: 1,
        origin: location.origin
      },
      events: {
        onReady(event) {
          ready = true;
          // Every page load always starts from 00:00 and muted.
          event.target.seekTo(0, true);
          event.target.setVolume(55);
          event.target.mute();
          updateButton(true);
          try { event.target.playVideo(); } catch (_) {}
        },
        onStateChange(event) {
          if (event.data === YT.PlayerState.ENDED) {
            try {
              event.target.seekTo(0, true);
              event.target.mute();
              updateButton(true);
              event.target.playVideo();
            } catch (_) {}
          }
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
        player.playVideo();
        updateButton(false);
      } else {
        player.mute();
        updateButton(true);
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

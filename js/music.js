(() => {
  'use strict';
  const VIDEO_ID = 'dTS_aNfpbIM';
  const COVER = 'https://i.ytimg.com/vi/dTS_aNfpbIM/hqdefault.jpg';
  const TITLE = 'Chest Pain (I Love)';
  const ARTIST = 'Malcolm Todd';
  let player = null, ready = false;

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
    btn.textContent = v ? 'UNMUTE' : 'MUTE';
    state.textContent = v ? 'MUTED' : 'PLAYING';
  }

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
        mute: 1,
        origin: location.origin
      },
      events: {
        onReady(e) {
          ready = true;
          e.target.seekTo(0, true);
          e.target.setVolume(55);
          e.target.mute();
          try { e.target.playVideo(); } catch (_) {}
          setMutedUI(true);
        },
        onStateChange(e) {
          if (e.data === YT.PlayerState.PLAYING) {
            state.textContent = e.target.isMuted() ? 'MUTED' : 'PLAYING';
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

  // Toggle button
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!player || !ready) return;
    try {
      if (player.isMuted()) {
        player.unMute();
        player.setVolume(55);
        player.mute();
      player.seekTo(0, true);
      setTimeout(() => { player.mute(); player.seekTo(0, true); player.playVideo(); }, 1000);
        setMutedUI(false);
      } else {
        player.mute();
        setMutedUI(true);
      }
    } catch (_) {}
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

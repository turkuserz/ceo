
(() => {
  const playerEl = document.getElementById('youtube-player');
  const miniBtn = document.getElementById('miniPlayPauseBtn');
  const playIcon = document.getElementById('miniPlayIcon');
  const pauseIcon = document.getElementById('miniPauseIcon');
  if(!playerEl || !miniBtn) return;

  let player=null, ready=false;

  function mutedIcon(muted){
    if(playIcon) playIcon.style.display=muted?'none':'block';
    if(pauseIcon) pauseIcon.style.display=muted?'block':'none';
  }

  function getMuted(){
    return localStorage.getItem('bastienMusicMuted') === '1';
  }
  function setMuted(v){
    localStorage.setItem('bastienMusicMuted',v?'1':'0');
    mutedIcon(v);
  }

  window.onYouTubeIframeAPIReady = function(){
    player = new YT.Player('youtube-player',{
      events:{
        onReady(e){
          ready=true;
          const muted=getMuted();
          e.target.setVolume(50);
          if(muted) e.target.mute();
          else e.target.unMute();
          try{e.target.playVideo()}catch(_){}
          mutedIcon(muted);
        },
        onStateChange(e){
          if(e.data===YT.PlayerState.ENDED){
            try{e.target.playVideo()}catch(_){}
          }
        }
      }
    });
  };

  miniBtn.addEventListener('click',(ev)=>{
    ev.stopPropagation();
    if(!player||!ready)return;
    const muted=player.isMuted();
    if(muted){
      player.unMute(); player.setVolume(50); setMuted(false);
    }else{
      player.mute(); setMuted(true);
    }
  });

  const unlock=()=>{
    if(!player||!ready)return;
    try{
      if(getMuted()) player.mute();
      else {player.unMute();player.setVolume(50);}
      player.playVideo();
    }catch(_){}
  };
  ['pointerdown','keydown','touchstart'].forEach(ev=>window.addEventListener(ev,unlock,{once:true,passive:true}));

  if(!document.querySelector('script[data-bastien-youtube-api]')){
    const api=document.createElement('script');
    api.src='https://www.youtube.com/iframe_api';
    api.async=true;
    api.dataset.bastienYoutubeApi='1';
    document.head.appendChild(api);
  }
})();

/* BASTIEN shared YouTube music
   Video: dTS_aNfpbIM
   Autoplay is attempted automatically. Browsers may block audible autoplay;
   if blocked, the first click/tap/keypress starts and unmutes it.
*/
(() => {
  'use strict';
  const VIDEO_ID='dTS_aNfpbIM';
  const COVER='https://i.ytimg.com/vi/dTS_aNfpbIM/hqdefault.jpg';
  const KEY_TIME='bastienMusicTime';
  const KEY_MUTED='bastienMusicMuted';
  let player=null, ready=false, lastSave=0;

  const dock=document.createElement('div');
  dock.id='bastienMusicDock';
  dock.innerHTML=`<div class="cover" style="background-image:url('${COVER}')"></div><div class="meta"><div class="music-title">ORIGINAL TRACK</div><div class="music-sub">BASTIEN • MUSIC</div></div><button id="bastienMusicToggle" aria-label="Mute or unmute">🔊</button><div class="state" id="bastienMusicState">AUTO PLAY</div>`;
  document.body.appendChild(dock);
  const frame=document.createElement('div'); frame.id='bastienMusicFrame'; document.body.appendChild(frame);
  const btn=dock.querySelector('#bastienMusicToggle'), state=dock.querySelector('#bastienMusicState');

  function muted(){return localStorage.getItem(KEY_MUTED)==='1'}
  function setMuted(v){localStorage.setItem(KEY_MUTED,v?'1':'0');btn.textContent=v?'🔇':'🔊';state.textContent=v?'MUTED':'PLAYING'}
  function resumeTime(){const n=parseFloat(localStorage.getItem(KEY_TIME)||'0');return Number.isFinite(n)&&n>2?n:0}
  function saveTime(){if(!player||!ready)return;try{localStorage.setItem(KEY_TIME,String(player.getCurrentTime()))}catch(_){} }

  window.onYouTubeIframeAPIReady=function(){
    if(player) return;
    player=new YT.Player(frame,{width:1,height:1,videoId:VIDEO_ID,playerVars:{autoplay:1,controls:0,disablekb:1,fs:0,loop:1,playlist:VIDEO_ID,playsinline:1,rel:0,origin:location.origin},events:{
      onReady(e){
        ready=true;
        const t=resumeTime(); if(t>0) e.target.seekTo(t,true);
        e.target.setVolume(55);
        // Try audible autoplay first. If browser blocks it, retry muted.
        try{ if(muted()) e.target.mute(); else e.target.unMute(); e.target.playVideo(); }catch(_){ }
        setMuted(e.target.isMuted());
        state.textContent=e.target.isMuted()?'CLICK TO UNMUTE':'PLAYING';
      },
      onStateChange(e){
        if(e.data===YT.PlayerState.PLAYING){state.textContent=e.target.isMuted()?'MUTED':'PLAYING'}
        if(e.data===YT.PlayerState.ENDED){try{e.target.playVideo()}catch(_){}
        }
      },
      onError(){state.textContent='YOUTUBE ERROR'}
    }});
  };

  btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(!player||!ready)return;try{if(player.isMuted()){player.unMute();player.setVolume(55);setMuted(false);player.playVideo()}else{player.mute();setMuted(true)}}catch(_){}});

  const unlock=()=>{if(!player||!ready)return;try{if(muted()){player.mute()}else{player.unMute();player.setVolume(55)}player.playVideo()}catch(_){} };
  ['pointerdown','keydown','touchstart'].forEach(ev=>window.addEventListener(ev,unlock,{once:true,passive:true}));
  setInterval(saveTime,2000);
  window.addEventListener('pagehide',saveTime,{passive:true});
  window.addEventListener('beforeunload',saveTime,{passive:true});

  const api=document.createElement('script');api.src='https://www.youtube.com/iframe_api';api.async=true;document.head.appendChild(api);
})();

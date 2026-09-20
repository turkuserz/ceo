/* BASTIEN: one YouTube player, one unified compact Wellesley-inspired card.
 * Music metadata is read from a separate /api/music endpoint. No member data is touched. */
(() => {
  'use strict';
  if (document.getElementById('bastienMusicDock')) return;
  const DEFAULT = {videoId:'dTS_aNfpbIM',title:'Chest Pain (I Love)',artist:'Malcolm Todd',startSeconds:0};
  const START_VOLUME = 65;
  const ICON = {
    restart:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11a9 9 0 1 1 2.8 6.5M3 4v7h7"/></svg>',
    play:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 12 7-12 7V5Z" fill="currentColor" stroke="none"/></svg>',
    pause:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="5" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="5" width="5" height="14" rx="1" fill="currentColor" stroke="none"/></svg>',
    sound:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5ZM15 9a5 5 0 0 1 0 6M18 6a9 9 0 0 1 0 12"/></svg>',
    muted:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5ZM16 9l5 6m0-6-5 6"/></svg>'
  };
  const dock = document.createElement('section');
  dock.id = 'bastienMusicDock';
  dock.setAttribute('aria-label','BASTIEN music player');
  dock.innerHTML = `
    <div class="music-video-shell"><div id="bastienMusicFrame"></div></div>
    <div class="music-track">
      <div class="music-vinyl"><img id="bastienMusicCover" src="https://i.ytimg.com/vi/${DEFAULT.videoId}/hqdefault.jpg" alt="" loading="lazy" decoding="async"></div>
      <div class="music-meta"><div class="music-overline">NOW PLAYING <span class="music-live-dot" aria-hidden="true"></span></div>
        <strong class="music-title" id="bastienMusicTitle"></strong><span class="music-artist" id="bastienMusicArtist"></span></div>
    </div>
    <div class="music-controls">
      <button type="button" class="music-button" id="bastienMusicRestart" aria-label="Restart track" title="Restart track" disabled>${ICON.restart}</button>
      <button type="button" class="music-button music-main-button" id="bastienMusicPlay" aria-label="Play" title="Play" disabled>${ICON.play}</button>
      <button type="button" class="music-button" id="bastienMusicMute" aria-label="Mute" title="Mute" disabled>${ICON.sound}</button>
      <label class="music-volume-label"><span class="music-sr-only">Volume</span><input id="bastienMusicVolume" type="range" min="0" max="100" value="${START_VOLUME}" aria-label="Volume" disabled></label>
    </div>
    <p class="music-hint" id="bastienMusicHint" hidden></p>
    <a class="music-external" id="bastienMusicExternal" href="https://www.youtube.com/watch?v=${DEFAULT.videoId}" target="_blank" rel="noopener noreferrer" hidden>OPEN ON YOUTUBE ↗</a>
    <span class="music-sr-only" id="bastienMusicStatus" role="status" aria-live="polite"></span>`;
  document.body.appendChild(dock);

  const el = id => dock.querySelector('#' + id);
  const restart = el('bastienMusicRestart'),play = el('bastienMusicPlay'),mute = el('bastienMusicMute');
  const volume = el('bastienMusicVolume'),title = el('bastienMusicTitle'),artist = el('bastienMusicArtist');
  const cover = el('bastienMusicCover'),hint = el('bastienMusicHint'),status = el('bastienMusicStatus'),external = el('bastienMusicExternal');
  cover.addEventListener('error',() => { if (!cover.src.endsWith('/assets/logobastien.png')) cover.src='./assets/logobastien.png'; });
  let song={...DEFAULT},player=null,ready=false,playing=false,muted=false,errored=false,interacted=false,phase='sound',requestedVolume=START_VOLUME;
  let startTimer=null,scriptTimer=null,settingsBusy=false;
  const videoUrl=id=>'https://www.youtube.com/watch?v='+id;
  function announce(message,show=false){status.textContent=message;hint.textContent=show?message:'';hint.hidden=!show;}
  function clearTimer(){if(startTimer!==null)clearTimeout(startTimer);startTimer=null;}
  function isPlaying(){try{return player.getPlayerState()===window.YT.PlayerState.PLAYING;}catch{return playing;}}
  function paint(){
    title.textContent=song.title;title.title=song.title;artist.textContent=song.artist;
    const art='https://i.ytimg.com/vi/'+song.videoId+'/hqdefault.jpg';
    if(cover.getAttribute('src')!==art)cover.src=art;
    external.href=videoUrl(song.videoId);
    if(ready&&player&&typeof player.getIframe==='function'){
      const iframe=player.getIframe();
      if(iframe)iframe.setAttribute('title',song.artist+' — '+song.title);
    }
  }
  function controls(){
    [restart,play,mute,volume].forEach(control=>control.disabled=!ready||errored);
    play.innerHTML=playing?ICON.pause:ICON.play;play.setAttribute('aria-label',playing?'Pause':'Play');play.title=playing?'Pause':'Play';
    mute.innerHTML=muted||requestedVolume===0?ICON.muted:ICON.sound;
    mute.setAttribute('aria-label',muted||requestedVolume===0?'Unmute':'Mute');mute.title=muted?'Unmute':'Mute';
    mute.setAttribute('aria-pressed',String(!muted));
    dock.dataset.playing=String(playing);dock.dataset.muted=String(muted);
    dock.dataset.autoplayFallback=String(muted&&!interacted);
    dock.dataset.volume=String(requestedVolume);
    volume.value=String(requestedVolume);
    volume.style.setProperty('--music-progress',requestedVolume+'%');
  }
  function error(message){
    errored=true;playing=false;phase='done';clearTimer();announce(message,true);external.hidden=false;controls();
  }
  function fallbackMuted(){
    if(!ready||errored||interacted||phase!=='sound')return;
    if(isPlaying()){
      phase='done';playing=true;muted=player.isMuted();clearTimer();announce(muted?'Playing muted — tap speaker for sound':'Playing with sound',muted);controls();return;
    }
    phase='muted';clearTimer();
    try{
      player.mute();muted=true;announce('Sound autoplay blocked — trying muted playback',true);controls();player.playVideo();
      startTimer=setTimeout(()=>{
        if(!interacted&&phase==='muted'&&!isPlaying()){
          phase='done';playing=false;announce('Tap Play to start music',true);controls();
        }
      },3800);
    }catch{phase='done';announce('Tap Play to start music',true);controls();}
  }
  function trySound(){
    if(!ready||errored)return;
    phase='sound';clearTimer();
    try{
      player.setVolume(Math.max(1,requestedVolume));player.unMute();muted=false;
      announce('Trying autoplay with sound');controls();player.playVideo();
      startTimer=setTimeout(fallbackMuted,2800);
    }catch{fallbackMuted();}
  }
  restart.addEventListener('click',()=>{
    if(!ready||errored)return;
    interacted=true;phase='done';clearTimer();
    try{player.seekTo(song.startSeconds,true);player.playVideo();announce('Restarted at '+song.startSeconds+'s');}
    catch{announce('Could not restart track',true);}
  });
  play.addEventListener('click',()=>{
    if(!ready||errored)return;
    interacted=true;phase='done';clearTimer();
    try{
      if(isPlaying()){
        player.pauseVideo();playing=false;announce('Music paused');
      }else{
        // A real Play click is a user gesture. Unmute explicitly instead of re-muting later.
        if(requestedVolume===0)requestedVolume=START_VOLUME;
        player.setVolume(requestedVolume);player.unMute();muted=false;player.playVideo();announce('Starting music');
      }
      controls();
    }catch{announce('Could not control music',true);}
  });
  mute.addEventListener('click',()=>{
    if(!ready||errored)return;
    interacted=true;phase='done';clearTimer();
    try{
      if(player.isMuted()||requestedVolume===0){
        if(!requestedVolume)requestedVolume=START_VOLUME;
        player.setVolume(requestedVolume);player.unMute();muted=false;
        if(!isPlaying())player.playVideo();announce('Sound on');
      }else{player.mute();muted=true;announce('Sound off');}
      controls();
    }catch{announce('Could not change sound',true);}
  });
  volume.addEventListener('input',()=>{
    if(!ready||errored)return;
    interacted=true;phase='done';clearTimer();requestedVolume=Number(volume.value);
    try{
      player.setVolume(requestedVolume);
      if(requestedVolume>0){player.unMute();muted=false;if(!isPlaying())player.playVideo();}
      else{player.mute();muted=true;}
      announce(requestedVolume?'Volume '+requestedVolume+'%':'Muted');controls();
    }catch{announce('Could not adjust volume',true);}
  });

  function updateSong(next){
    if(!next||!/^[\w-]{11}$/.test(next.videoId)||typeof next.title!=='string'||typeof next.artist!=='string'||!Number.isInteger(next.startSeconds)||next.startSeconds<0||next.startSeconds>86400)return;
    const changed=next.videoId!==song.videoId;
    const preserveManualMute=interacted&&muted;
    const preserveManualPause=interacted&&!isPlaying();
    song={videoId:next.videoId,title:next.title,artist:next.artist,startSeconds:next.startSeconds};
    paint();
    if(!changed||!ready||!player||errored)return;
    phase='sound';playing=false;external.hidden=true;clearTimer();
    try{
      // Reuse this same iframe and keep manual pause/mute choices after an ADMIN update.
      if(preserveManualPause){
        player.cueVideoById({videoId:song.videoId,startSeconds:song.startSeconds});
        interacted=true;phase='done';playing=false;controls();return;
      }
      player.loadVideoById({videoId:song.videoId,startSeconds:song.startSeconds});
      player.setVolume(Math.max(1,requestedVolume));
      if(preserveManualMute){player.mute();muted=true;interacted=true;phase='done';}
      else{interacted=false;player.unMute();muted=false;startTimer=setTimeout(fallbackMuted,3000);}
      controls();
    }catch{error('Could not load updated song');}
  }
  async function refreshSong(){
    if(settingsBusy)return;settingsBusy=true;
    try{
      const response=await fetch('/api/music',{cache:'no-store',headers:{Accept:'application/json'},signal:AbortSignal.timeout(7000)});
      if(!response.ok)return;const data=await response.json();
      if(data&&data.song)updateSong(data.song);
    }catch{/* The original default remains playable if the optional server is not configured. */}
    finally{settingsBusy=false;}
  }
  function initYouTube(){
    if(player||!window.YT||!window.YT.Player)return;
    // Settings can arrive after the iframe is created but before onReady fires.
    const createdForVideoId=song.videoId;
    if(scriptTimer!==null)clearTimeout(scriptTimer);
    try{
      player=new window.YT.Player('bastienMusicFrame',{
        width:200,height:200,videoId:song.videoId,
        playerVars:{autoplay:1,mute:0,start:song.startSeconds,controls:1,playsinline:1,rel:0,
          ...(location.origin!=='null'?{origin:location.origin}:{})},
        events:{
          onReady(event){
            ready=true;
            try{
              const frame=event.target.getIframe();
              frame.setAttribute('allow','autoplay; encrypted-media; picture-in-picture');
              frame.setAttribute('title',song.artist+' — '+song.title);
              if(song.videoId!==createdForVideoId){
                event.target.loadVideoById({videoId:song.videoId,startSeconds:song.startSeconds});
              }
              trySound();
            }catch{fallbackMuted();}
          },
          onStateChange(event){
            const states=window.YT.PlayerState;
            if(event.data===states.PLAYING){
              playing=true;muted=event.target.isMuted();phase='done';clearTimer();
              announce(muted?'Playing muted — tap speaker for sound':'Playing with sound',muted&&!interacted);
            }else if(event.data===states.PAUSED){playing=false;if(interacted)announce('Music paused');}
            else if(event.data===states.ENDED){
              playing=false;
              try{event.target.seekTo(song.startSeconds,true);event.target.playVideo();}catch{}
            }
            controls();
          },
          onAutoplayBlocked(){
            if(isPlaying())return;
            if(!interacted&&phase==='sound'){if(ready)fallbackMuted();}
            else if(!interacted&&phase==='muted'){
              phase='done';clearTimer();announce('Tap Play to start music',true);controls();
            }else{announce('Playback blocked — tap Play to retry',true);}
          },
          onError(event){
            const code=event?.data;
            error([100,101,150,153].includes(code)?'Video cannot be embedded — open YouTube':'YouTube playback unavailable');
          }
        }
      });
    }catch{error('YouTube player could not initialize');}
  }
  paint();controls();
  // Initial playback begins promptly; fetched admin settings replace the track in-place.
  refreshSong();
  if(window.YT&&window.YT.Player)initYouTube();
  else{
    const previous=window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady=()=>{if(typeof previous==='function')previous();initYouTube();};
    if(!document.querySelector('script[data-bastien-yt-api]')){
      const api=document.createElement('script');api.src='https://www.youtube.com/iframe_api';api.async=true;
      api.dataset.bastienYtApi='1';api.onerror=()=>error('YouTube could not load');document.head.appendChild(api);
    }
    scriptTimer=setTimeout(()=>{if(!player)error('YouTube could not load');},12000);
  }
  // Read-only polling: saved ADMIN changes appear on open tabs without database writes.
  window.setInterval(()=>{if(document.visibilityState==='visible')refreshSong();},20000);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refreshSong();});
})();

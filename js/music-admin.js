/* Adds music controls AFTER the existing KeyAuth ADMIN session check succeeds.
 * A serverless backend independently checks that same session before each write. */
import {getKeyAuthUser} from './keyauth-login.js';
const DEFAULT={videoId:'dTS_aNfpbIM',title:'Chest Pain (I Love)',artist:'Malcolm Todd',startSeconds:0};
const $=id=>document.getElementById(id);
function show(message,isError=false){const e=$('musicSettingsStatus');e.textContent=message;e.dataset.error=String(isError);}
function setFields(song){
  $('musicYoutubeUrl').value='https://www.youtube.com/watch?v='+song.videoId;
  $('musicSongTitle').value=song.title;
  $('musicSongArtist').value=song.artist;
  $('musicStartSeconds').value=song.startSeconds;
  $('musicSettingsCover').src='https://i.ytimg.com/vi/'+song.videoId+'/hqdefault.jpg';
}
export async function initMusicAdmin(){
  const form=$('bastienMusicSettingsForm');
  if(!form)return;
  const save=$('musicSettingsSave');
  setFields(DEFAULT);
  show('Loading saved music settings…');
  try{
    const res=await fetch('/api/music',{cache:'no-store',headers:{Accept:'application/json'},signal:AbortSignal.timeout(9000)});
    const data=await res.json();
    if(!res.ok)throw new Error(data.error||'Music backend is not configured');
    if(data.song)setFields(data.song);
    show('Connected to saved music settings. Changes will appear on the website.');
  }catch(err){show('Server not ready: '+(err.message||'Check deployment setup in MUSIC-SETUP.txt'),true);}
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    const sessionId=getKeyAuthUser()?.sessionid;
    if(!sessionId){show('KeyAuth session missing — log in again.',true);return;}
    const song={
      youtubeUrl:$('musicYoutubeUrl').value.trim(),
      title:$('musicSongTitle').value.trim(),
      artist:$('musicSongArtist').value.trim(),
      startSeconds:Number($('musicStartSeconds').value)
    };
    if(!song.youtubeUrl||!song.title||!song.artist||!Number.isInteger(song.startSeconds)||song.startSeconds<0){
      show('Fill in YouTube URL, song name, artist and valid start seconds.',true);return;
    }
    save.disabled=true;show('Saving in Firebase…');
    try{
      const response=await fetch('/api/music',{
        method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},
        cache:'no-store',body:JSON.stringify({sessionId,song}),signal:AbortSignal.timeout(15000)
      });
      const result=await response.json();
      if(!response.ok||result.saved!==true)throw new Error(result.error||'Save failed');
      setFields(result.song);
      show('SAVED • Music, artwork and title will update on open pages within 20 seconds.');
    }catch(err){show('NOT SAVED: '+(err.message||'Check API and credentials'),true);}
    finally{save.disabled=false;}
  });
}

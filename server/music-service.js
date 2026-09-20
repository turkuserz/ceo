/* Server-side music settings. Never embed Firebase service-account credentials in browser files.
 * All writes address ONLY siteSettings/music; existing member paths and rules are untouched. */
'use strict';
const { createSign } = require('node:crypto');
const DEFAULT = Object.freeze({videoId:'dTS_aNfpbIM',title:'Chest Pain (I Love)',artist:'Malcolm Todd',startSeconds:0});
const DB_URL = 'https://bastien2k26-default-rtdb.asia-southeast1.firebasedatabase.app';
let cachedAccess = null;

function videoIdFrom(input){
  if(typeof input !== 'string' || input.length > 300) throw new Error('Enter a valid YouTube URL');
  const raw=input.trim();
  if(/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;
  let url; try { url=new URL(raw); } catch { throw new Error('Invalid YouTube URL'); }
  if(url.protocol !== 'https:') throw new Error('Use an HTTPS YouTube URL');
  const host=url.hostname.toLowerCase();
  let id='';
  if(host==='youtu.be' || host==='www.youtu.be') id=url.pathname.slice(1).split('/')[0];
  else if(['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com','www.youtube-nocookie.com','youtube-nocookie.com'].includes(host)) {
    if(url.pathname==='/watch') id=url.searchParams.get('v') || '';
    else if(/^\/(embed|shorts|live)\//.test(url.pathname)) id=url.pathname.split('/')[2];
  }
  if(!/^[a-zA-Z0-9_-]{11}$/.test(id)) throw new Error('Invalid YouTube video ID');
  return id;
}
function normalize(input){
  if(!input || typeof input!=='object' || Array.isArray(input)) throw new Error('Invalid song data');
  const videoId=videoIdFrom(input.youtubeUrl || input.videoId || '');
  const title=String(input.title||'').trim();
  const artist=String(input.artist||'').trim();
  const seconds=Number(input.startSeconds);
  if(!title || title.length>100 || !artist || artist.length>100) throw new Error('Title and artist: 1–100 characters');
  if(!Number.isInteger(seconds) || seconds<0 || seconds>86400) throw new Error('Start time must be 0–86400 seconds');
  return {videoId,title,artist,startSeconds:seconds};
}
function config(){
  let account;
  try { account=JSON.parse(process.env.BASTIEN_FIREBASE_SERVICE_ACCOUNT || ''); }
  catch { throw Object.assign(new Error('Set BASTIEN_FIREBASE_SERVICE_ACCOUNT in hosting environment'),{status:503}); }
  if(!account.client_email || !account.private_key || account.project_id!=='bastien2k26') throw Object.assign(new Error('Firebase service account must belong to existing bastien2k26 project'),{status:503});
  const url=(process.env.BASTIEN_FIREBASE_DATABASE_URL || DB_URL).replace(/\/$/,'');
  if(url!==DB_URL) throw Object.assign(new Error('Firebase database URL must match existing project'),{status:503});
  return {account,url};
}
async function accessToken(account){
  if(cachedAccess && cachedAccess.email===account.client_email && Date.now()<cachedAccess.expires) return cachedAccess.token;
  const now=Math.floor(Date.now()/1000);
  const b64=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
  const body=b64({alg:'RS256',typ:'JWT'})+'.'+b64({iss:account.client_email,scope:'https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600});
  const sig=createSign('RSA-SHA256').update(body).end().sign(account.private_key,'base64url');
  const response=await fetch('https://oauth2.googleapis.com/token',{
    method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},
    body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:body+'.'+sig}).toString(),
    signal:AbortSignal.timeout(9000)
  });
  const data=await response.json();
  if(!response.ok || !data.access_token) throw Object.assign(new Error('Firebase server credentials were rejected'),{status:503});
  cachedAccess={email:account.client_email,token:data.access_token,expires:Date.now()+Math.max(60,(data.expires_in||3600)-120)*1000};
  return cachedAccess.token;
}
async function firebaseRequest(method,data){
  const {account,url}=config();
  const token=await accessToken(account);
  const response=await fetch(url+'/siteSettings/music.json?access_token='+encodeURIComponent(token),{
    method,headers:{'content-type':'application/json'},
    ...(method==='PUT'?{body:JSON.stringify(data)}:{}),signal:AbortSignal.timeout(9000)
  });
  if(!response.ok) throw Object.assign(new Error('Firebase music setting request failed ('+response.status+')'),{status:502});
  return response.json();
}
async function verifyKeyAuth(sessionId){
  if(typeof sessionId!=='string' || !/^[a-zA-Z0-9_-]{8,256}$/.test(sessionId)) return false;
  // Matches the existing site's KeyAuth app and server-side checks that a live session is valid.
  // A client-supplied username is never trusted as proof of authorization.
  const qs=new URLSearchParams({type:'check',sessionid:sessionId,name:"Darkkiss0099's Application",ownerid:'rG4No56qoe'});
  const res=await fetch('https://keyauth.win/api/1.3/?'+qs,{headers:{Accept:'application/json'},cache:'no-store',signal:AbortSignal.timeout(9000)});
  if(!res.ok) return false;
  const response=await res.json();
  return response.success===true && (!response.ownerid || response.ownerid==='rG4No56qoe');
}
function errorResponse(status,message){ return {status,body:{error:message}}; }
async function handle(method,body,origin,host){
  if(method==='GET'){
    try {const data=await firebaseRequest('GET');return {status:200,body:{song:data?normalize(data):DEFAULT}};}
    catch(err){return errorResponse(err.status||502,err.status===503?err.message:'Music data temporarily unavailable');}
  }
  if(method!=='POST') return errorResponse(405,'Method not allowed');
  if(origin){
    let sentHost;try{sentHost=new URL(origin).host;}catch{return errorResponse(403,'Invalid origin');}
    if(!host || sentHost!==host) return errorResponse(403,'Cross-origin music updates are forbidden');
  }
  let value;try{value=typeof body==='string'?JSON.parse(body):body||{};}catch{return errorResponse(400,'Invalid JSON');}
  if(JSON.stringify(value).length>2000) return errorResponse(413,'Music payload too large');
  let song;
  try{song=normalize(value.song);}catch(err){return errorResponse(400,err.message);}
  // Check environment BEFORE authenticating to give a precise deployment error.
  try{config();}catch(err){return errorResponse(err.status||503,err.message);}
  let authenticated=false;
  try{authenticated=await verifyKeyAuth(value.sessionId);}catch{return errorResponse(502,'Cannot verify KeyAuth session right now');}
  if(!authenticated) return errorResponse(401,'KeyAuth login required or session expired');
  try {await firebaseRequest('PUT',song);return {status:200,body:{song,saved:true}};}
  catch(err){return errorResponse(err.status||502,'Could not save music in Firebase');}
}
module.exports={DEFAULT,videoIdFrom,normalize,handle};

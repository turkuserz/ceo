'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{generateKeyPairSync}=require('node:crypto');
const {DEFAULT,normalize,videoIdFrom,handle}=require('../server/music-service');
const originalFetch=global.fetch;
const originalEnv=process.env.BASTIEN_FIREBASE_SERVICE_ACCOUNT;
const {privateKey}=generateKeyPairSync('rsa',{modulusLength:2048});
process.env.BASTIEN_FIREBASE_SERVICE_ACCOUNT=JSON.stringify({project_id:'bastien2k26',client_email:'music-test@bastien2k26.iam.gserviceaccount.com',private_key:privateKey.export({type:'pkcs8',format:'pem'})});
let record=null,requests=[],validSession=true;
const ok=(data)=>({ok:true,status:200,json:async()=>data});
global.fetch=async(url,opts={})=>{
  url=String(url);requests.push({url,method:opts.method||'GET'});
  if(url.includes('oauth2.googleapis.com/token'))return ok({access_token:'mockToken',expires_in:3600});
  if(url.includes('keyauth.win/api/1.3/'))return ok({success:validSession && new URL(url).searchParams.get('sessionid')==='123456789abcdef',ownerid:'rG4No56qoe'});
  if(url.includes('/siteSettings/music.json?access_token=')){
    if(opts.method==='PUT'){record=JSON.parse(opts.body);return ok(record);}
    return ok(record);
  }
  throw Error('Unexpected network request '+url);
};
test('YouTube URL validation and normalized metadata',()=>{
  assert.equal(videoIdFrom('https://youtu.be/dTS_aNfpbIM?t=90'),DEFAULT.videoId);
  assert.equal(videoIdFrom('https://www.youtube.com/watch?v=dTS_aNfpbIM'),DEFAULT.videoId);
  assert.equal(videoIdFrom('https://youtube.com/shorts/dTS_aNfpbIM'),DEFAULT.videoId);
  assert.throws(()=>videoIdFrom('https://evil.example/watch?v=dTS_aNfpbIM'));
  assert.throws(()=>normalize({videoId:'dTS_aNfpbIM',title:'',artist:'X',startSeconds:0}));
  assert.throws(()=>normalize({videoId:'dTS_aNfpbIM',title:'X',artist:'Y',startSeconds:-1}));
});
test('GET returns original track if settings are not yet saved',async()=>{
  const result=await handle('GET',null,null,'bastien.example');
  assert.equal(result.status,200);assert.deepEqual(result.body.song,DEFAULT);
});
test('POST rejects cross-origin calls and missing/wrong KeyAuth sessions',async()=>{
  const song={youtubeUrl:'https://youtu.be/xBJ4YkQq1i8',title:'Test',artist:'Artist',startSeconds:10};
  assert.equal((await handle('POST',{song,sessionId:'123456789abcdef'},'https://other.example','bastien.example')).status,403);
  assert.equal((await handle('POST',{song,sessionId:'not-valid'},'https://bastien.example','bastien.example')).status,401);
  validSession=false;
  assert.equal((await handle('POST',{song,sessionId:'123456789abcdef'},'https://bastien.example','bastien.example')).status,401);
  validSession=true;
});
test('POST persists ONLY music settings and next GET returns same metadata',async()=>{
  const song={youtubeUrl:'https://youtu.be/xBJ4YkQq1i8',title:'Saved song',artist:'Saved artist',startSeconds:120};
  const result=await handle('POST',{song,sessionId:'123456789abcdef'},'https://bastien.example','bastien.example');
  assert.equal(result.status,200);assert.equal(result.body.saved,true);
  assert.deepEqual(result.body.song,{videoId:'xBJ4YkQq1i8',title:'Saved song',artist:'Saved artist',startSeconds:120});
  assert.deepEqual((await handle('GET',null,null,'bastien.example')).body.song,result.body.song);
  assert.equal(requests.some(r=>r.url.includes('/members')),false);
  assert.equal(requests.filter(r=>r.method==='PUT').length,1);
  assert.ok(requests.some(r=>r.url.includes('/siteSettings/music.json?access_token=')));
});
test('misconfigured service account returns explicit setup error, not fake saved success',async()=>{
  process.env.BASTIEN_FIREBASE_SERVICE_ACCOUNT='';
  assert.equal((await handle('GET')).status,503);
  assert.equal((await handle('POST',{song:{videoId:DEFAULT.videoId,title:'Title',artist:'Artist',startSeconds:0},sessionId:'123456789abcdef'},null,'bastien.example')).status,503);
  process.env.BASTIEN_FIREBASE_SERVICE_ACCOUNT=originalEnv;
  global.fetch=originalFetch;
});

/* Netlify serverless entry point; same implementation as Vercel. */
'use strict';
const {handle}=require('../../server/music-service');
exports.handler=async(event)=>{
  try{
    const result=await handle(event.httpMethod,event.body,event.headers.origin,event.headers.host);
    return {statusCode:result.status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store, max-age=0'},body:JSON.stringify(result.body)};
  }catch{return {statusCode:500,body:JSON.stringify({error:'Music service unavailable'})};}
};

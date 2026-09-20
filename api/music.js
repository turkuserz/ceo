/* Vercel serverless entry point. */
'use strict';
const {handle}=require('../server/music-service');
module.exports=async function(req,res){
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('Content-Type','application/json; charset=utf-8');
  try{
    const result=await handle(req.method,req.body,req.headers.origin,req.headers.host);
    return res.status(result.status).json(result.body);
  }catch{return res.status(500).json({error:'Music service unavailable'});}
};

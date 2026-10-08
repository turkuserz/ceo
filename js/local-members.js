import { MEMBER_SEED } from './member-seed.js';
export const GROUPS = ['BASTIEN','EVELYN','STANNOWAYHOME','JOPNOK','ASSASSIN'];
const KEY = 'bastien-members-local-v2';
const clone = x => JSON.parse(JSON.stringify(x));
function seed(){return Object.fromEntries(GROUPS.map(group=>[group,(MEMBER_SEED[group]||[]).map((p,i)=>({...clone(p),id:`seed-${group}-${i}`}))]));}
export function readMembersOnce(){
  try { const saved=localStorage.getItem(KEY); if(saved){const obj=JSON.parse(saved);return Object.fromEntries(GROUPS.map(group=>[group,Array.isArray(obj[group])?obj[group]:[]]));} }
  catch(e){console.warn('Local member storage unavailable',e);}
  return seed();
}
const listeners=new Set();
function emit(){const data=readMembersOnce();for(const cb of listeners)cb(data);}
function save(data){localStorage.setItem(KEY,JSON.stringify(data));emit();}
export function watchMembers(callback){listeners.add(callback);callback(readMembersOnce());return ()=>listeners.delete(callback);}
window.addEventListener('storage',e=>{if(e.key===KEY)emit();});
export async function addMember(group,person){const data=readMembersOnce();data[group].push({...clone(person),id:'local-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9)});save(data);}
export async function updateMember(group,id,person){const data=readMembersOnce(), idx=data[group].findIndex(p=>p.id===id);if(idx<0)throw Error('Member not found');data[group][idx]={...clone(person),id};save(data);}
export async function deleteMember(group,id){const data=readMembersOnce();data[group]=data[group].filter(p=>p.id!==id);save(data);}
export async function clearMembers(){save(Object.fromEntries(GROUPS.map(g=>[g,[]])));}
export function resetMembers(){localStorage.removeItem(KEY);emit();}

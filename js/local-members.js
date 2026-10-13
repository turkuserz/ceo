import { MEMBER_SEED } from './member-seed.js';
export const GROUPS = ['BASTIEN','EVELYN','STANNOWAYHOME','JOPNOK','ASSASSIN'];
const KEY = 'bastien-members-local-v2';
const clone = x => JSON.parse(JSON.stringify(x));
function seed(){return Object.fromEntries(GROUPS.map(group=>[group,(MEMBER_SEED[group]||[]).map((p,i)=>({...clone(p),id:`seed-${group}-${i}`}))]));}
export function readMembersOnce(){
  try { const saved=localStorage.getItem(KEY); if(saved){
    const obj=JSON.parse(saved);
    if(Array.isArray(obj.BASTIEN)){
      const members=obj.BASTIEN;
      const old=members.find(p=>p.name==='Churinmair Bastien');
      if(old)old.name='Aņgelirispęriwinklē Bastien';
      const arcus=members.find(p=>p.name==='Arcus Bastien');
      if(arcus)arcus.facebook='https://www.facebook.com/profile.php?id=61595233526511';
      obj.BASTIEN=members.filter(p=>p.name!=='NXx Bastien');
      const kury=obj.BASTIEN.find(p=>p.name==='Kury Bastien');
      if(kury)kury.facebook='https://www.facebook.com/profile.php?id=61591677795442';
      else obj.BASTIEN.push({...clone(MEMBER_SEED.BASTIEN.find(p=>p.name==='Kury Bastien')),id:'seed-BASTIEN-kury-2026'});
      // Keep existing browser data, update the renamed member and its Facebook URL.
      for(const group of GROUPS){
        const members=Array.isArray(obj[group])?obj[group]:[];
        for(const person of members){
          if(typeof person.name==='string' && /baki/i.test(person.name)){
            person.name=person.name.replace(/baki/gi,'Itachi');
            person.facebook='https://www.facebook.com/profile.php?id=61595392258515';
          }
          if(person.name==='Itachi Assassin')person.facebook='https://www.facebook.com/profile.php?id=61595392258515';
        }
      }
      const itachi=obj.BASTIEN.find(p=>p.name==='Itachi Bastien');
      if(itachi)itachi.facebook='https://www.facebook.com/profile.php?id=61595392258515';
      else obj.BASTIEN.push({...clone(MEMBER_SEED.BASTIEN.find(p=>p.name==='Itachi Bastien')),id:'seed-BASTIEN-itachi-2026'});
      if(JSON.stringify(obj)!==saved)localStorage.setItem(KEY,JSON.stringify(obj));
    }
    return Object.fromEntries(GROUPS.map(group=>[group,Array.isArray(obj[group])?obj[group]:[]]));
  } }
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

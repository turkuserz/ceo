import { ref, onValue, push, set, remove, get } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";
import { db, GROUPS } from "./firebase-config.js";

export function membersRef(){
  return ref(db, "members");
}

export function watchMembers(callback, onError){
  return onValue(membersRef(), snap => {
    const raw = snap.val() || {};
    const data = {};
    GROUPS.forEach(group => {
      const value = raw[group] || {};
      data[group] = Object.entries(value).map(([id, person]) => ({
        id,
        ...(person || {})
      })).filter(x => x.name);
    });
    callback(data);
  }, onError);
}

export async function addMember(group, person){
  const newRef = push(ref(db, `members/${group}`));
  await set(newRef, {
    name: String(person.name || "").trim(),
    role: String(person.role || "MEMBER"),
    facebook: String(person.facebook || "").trim(),
    photo: String(person.photo || "")
  });
}

export async function deleteMember(group, id){
  await remove(ref(db, `members/${group}/${id}`));
}

export async function clearMembers(){
  await remove(membersRef());
}

export async function readMembersOnce(){
  const snap = await get(membersRef());
  const raw = snap.val() || {};
  const data = {};
  GROUPS.forEach(group => {
    const value = raw[group] || {};
    data[group] = Object.entries(value).map(([id, person]) => ({id, ...(person || {})})).filter(x => x.name);
  });
  return data;
}

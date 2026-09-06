import { KEYAUTH } from "./keyauth-config.js";

let sessionid = null;

const DEVICE_KEY = "bastien_keyauth_device_id";

function getBrowserDeviceId() {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    if (crypto?.randomUUID) id = crypto.randomUUID();
    else id = "BASTIEN-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

async function api(data) {
  const qs = new URLSearchParams(data);
  const url = `${KEYAUTH.url}?${qs.toString()}`;
  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: { "Accept": "application/json" }
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`KeyAuth returned invalid response (${res.status})`);
  }

  if (!res.ok) throw new Error(json.message || `KeyAuth HTTP ${res.status}`);
  if (json.ownerid && json.ownerid !== KEYAUTH.ownerid) {
    throw new Error("Invalid KeyAuth application");
  }
  return json;
}

export async function initKeyAuth() {
  const r = await api({
    type: "init",
    ver: KEYAUTH.version,
    name: KEYAUTH.name,
    ownerid: KEYAUTH.ownerid
  });

  if (!r.success) throw new Error(r.message || "KeyAuth initialization failed");
  sessionid = r.sessionid;
  return r;
}

export async function loginWithKeyAuth(username, password) {
  if (!username || !password) {
    throw new Error("กรุณากรอก Username และ Password");
  }

  await initKeyAuth();
  const hwid = getBrowserDeviceId();

  const r = await api({
    type: "login",
    username,
    pass: password,
    sessionid,
    name: KEYAUTH.name,
    ownerid: KEYAUTH.ownerid,
    hwid
  });

  if (!r.success) {
    throw new Error(r.message || "Login failed");
  }

  sessionid = r.sessionid || sessionid;

  sessionStorage.setItem("bastien_keyauth_session", JSON.stringify({
    username: r.info?.username || username,
    sessionid,
    hwid: r.info?.hwid || hwid,
    loginAt: Date.now()
  }));

  return r;
}

export async function checkKeyAuthSession() {
  const raw = sessionStorage.getItem("bastien_keyauth_session");
  if (!raw) return false;

  try {
    const saved = JSON.parse(raw);
    await initKeyAuth();
    sessionid = saved.sessionid || sessionid;

    const r = await api({
      type: "check",
      sessionid,
      name: KEYAUTH.name,
      ownerid: KEYAUTH.ownerid
    });

    if (!r.success) {
      sessionStorage.removeItem("bastien_keyauth_session");
      sessionid = null;
      return false;
    }

    return true;
  } catch (err) {
    console.error("KeyAuth session check failed:", err);
    sessionStorage.removeItem("bastien_keyauth_session");
    sessionid = null;
    return false;
  }
}

export async function logoutKeyAuth() {
  const raw = sessionStorage.getItem("bastien_keyauth_session");

  try {
    if (raw) {
      const saved = JSON.parse(raw);
      const sid = sessionid || saved.sessionid;
      if (sid) {
        await api({
          type: "logout",
          sessionid: sid,
          name: KEYAUTH.name,
          ownerid: KEYAUTH.ownerid
        });
      }
    }
  } catch (err) {
    console.warn("KeyAuth logout failed:", err);
  }

  sessionStorage.removeItem("bastien_keyauth_session");
  sessionid = null;
}

export function getKeyAuthUser() {
  try {
    return JSON.parse(sessionStorage.getItem("bastien_keyauth_session") || "null");
  } catch {
    return null;
  }
}

export function getKeyAuthDeviceId() {
  return getBrowserDeviceId();
}

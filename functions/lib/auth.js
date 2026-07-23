const FIREBASE_PROJECT_ID = "reduzsim-2a6f2";
const FIREBASE_ISSUER = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;
const FIREBASE_JWK_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
const COOKIE_NAME = "reduzsim_crm_session";
const SESSION_TTL_SECONDS = 8 * 60 * 60;
const encoder = new TextEncoder();

let cachedJwks = null;
let cachedJwksExpiresAt = 0;

export async function exchangeFirebaseToken(idToken, env) {
  const claims = await verifyFirebaseIdToken(idToken);
  const email = normalizeEmail(claims.email);
  const firebaseUid = String(claims.sub || "");
  if (!email || !firebaseUid) return null;

  let user = await env.DB.prepare(`
    SELECT id, firebase_uid, email, name, role, enabled, session_version
    FROM app_users
    WHERE firebase_uid = ?
    LIMIT 1
  `).bind(firebaseUid).first();

  if (!user) {
    const pendingUser = await env.DB.prepare(`
      SELECT id, firebase_uid, email, name, role, enabled, session_version
      FROM app_users
      WHERE lower(email) = lower(?)
      LIMIT 1
    `).bind(email).first();

    if (!pendingUser || pendingUser.firebase_uid || Number(pendingUser.enabled) !== 1) return null;

    const now = new Date().toISOString();
    const result = await env.DB.prepare(`
      UPDATE app_users
      SET firebase_uid = ?, updated_at = ?
      WHERE id = ? AND firebase_uid IS NULL AND enabled = 1
    `).bind(firebaseUid, now, pendingUser.id).run();
    if (Number(result.meta?.changes || 0) !== 1) return null;
    user = { ...pendingUser, firebase_uid: firebaseUid, updated_at: now };
  }

  if (Number(user.enabled) !== 1 || normalizeEmail(user.email) !== email) return null;
  return normalizeUser(user);
}

export async function createSessionCookie(user, env) {
  const secret = sessionSecret(env);
  const now = Math.floor(Date.now() / 1000);
  const payload = toBase64Url(encoder.encode(JSON.stringify({
    sub: user.id,
    uid: user.firebaseUid,
    email: user.email,
    role: user.role,
    sv: user.sessionVersion,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
    v: 1,
  })));
  const signature = await sign(payload, secret);
  return serializeCookie(`${payload}.${signature}`, SESSION_TTL_SECONDS);
}

export function clearSessionCookie() {
  return serializeCookie("", 0);
}

export async function readSession(request, env) {
  const token = readCookie(request.headers.get("Cookie"), COOKIE_NAME);
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;

  try {
    const secret = sessionSecret(env);
    if (!await verifySignature(parts[0], parts[1], secret)) return null;

    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(parts[0])));
    const now = Math.floor(Date.now() / 1000);
    if (
      payload.v !== 1
      || !Number.isInteger(payload.exp)
      || payload.exp <= now
      || !payload.sub
      || !payload.uid
    ) {
      return null;
    }

    const user = await env.DB.prepare(`
      SELECT id, firebase_uid, email, name, role, enabled, session_version
      FROM app_users
      WHERE id = ? AND firebase_uid = ?
      LIMIT 1
    `).bind(String(payload.sub), String(payload.uid)).first();
    if (!user || Number(user.enabled) !== 1) return null;
    if (Number(user.session_version) !== Number(payload.sv)) return null;
    return normalizeUser(user);
  } catch (error) {
    return null;
  }
}

export async function verifyFirebaseIdToken(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3 || parts.some((part) => !part)) {
    throw new Error("Invalid Firebase token");
  }

  const header = parseJwtPart(parts[0]);
  const claims = parseJwtPart(parts[1]);
  if (header.alg !== "RS256" || typeof header.kid !== "string") {
    throw new Error("Unsupported Firebase token");
  }

  const jwks = await firebaseJwks();
  const jwk = jwks.keys?.find((candidate) => candidate.kid === header.kid);
  if (!jwk) throw new Error("Unknown Firebase signing key");

  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const signatureValid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    fromBase64Url(parts[2]),
    encoder.encode(`${parts[0]}.${parts[1]}`),
  );
  if (!signatureValid) throw new Error("Invalid Firebase signature");

  const now = Math.floor(Date.now() / 1000);
  const audienceValid = claims.aud === FIREBASE_PROJECT_ID
    || (Array.isArray(claims.aud) && claims.aud.includes(FIREBASE_PROJECT_ID));
  if (
    claims.iss !== FIREBASE_ISSUER
    || !audienceValid
    || !Number.isInteger(claims.exp)
    || claims.exp <= now
    || !Number.isInteger(claims.iat)
    || claims.iat > now + 60
    || !claims.sub
    || String(claims.sub).length > 128
  ) {
    throw new Error("Expired or invalid Firebase claims");
  }

  return claims;
}

function normalizeUser(row) {
  return {
    id: String(row.id),
    firebaseUid: String(row.firebase_uid || ""),
    email: normalizeEmail(row.email),
    name: String(row.name || ""),
    role: row.role === "admin" ? "admin" : "user",
    sessionVersion: Number(row.session_version || 1),
  };
}

async function firebaseJwks() {
  const now = Date.now();
  if (cachedJwks && cachedJwksExpiresAt > now) return cachedJwks;

  const response = await fetch(FIREBASE_JWK_URL, {
    headers: { Accept: "application/json" },
    cf: { cacheTtl: 3600, cacheEverything: true },
  });
  if (!response.ok) throw new Error("Unable to load Firebase signing keys");

  cachedJwks = await response.json();
  const cacheControl = response.headers.get("Cache-Control") || "";
  const maxAge = Number(cacheControl.match(/max-age=(\d+)/i)?.[1] || 3600);
  cachedJwksExpiresAt = now + Math.max(300, maxAge) * 1000;
  return cachedJwks;
}

function sessionSecret(env) {
  const secret = String(env.SESSION_SECRET || "");
  if (secret.length < 32) throw new Error("SESSION_SECRET is not configured");
  return secret;
}

async function sign(value, secret) {
  const key = await hmacKey(secret, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return toBase64Url(new Uint8Array(signature));
}

async function verifySignature(value, signature, secret) {
  const key = await hmacKey(secret, ["verify"]);
  return crypto.subtle.verify("HMAC", key, fromBase64Url(signature), encoder.encode(value));
}

function hmacKey(secret, usages) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    usages,
  );
}

function parseJwtPart(value) {
  return JSON.parse(new TextDecoder().decode(fromBase64Url(value)));
}

function readCookie(header, name) {
  const prefix = `${name}=`;
  return String(header || "")
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length) || "";
}

function serializeCookie(value, maxAge) {
  return [
    `${COOKIE_NAME}=${value}`,
    "Path=/",
    `Max-Age=${maxAge}`,
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
  ].join("; ");
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase().slice(0, 254);
}

function toBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value) {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(normalized + padding);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}


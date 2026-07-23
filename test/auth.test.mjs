import assert from "node:assert/strict";
import test from "node:test";
import {
  createSessionCookie,
  readSession,
} from "../functions/lib/auth.js";

const sessionUser = {
  id: "user-mayssa",
  firebaseUid: "firebase-test-uid",
  email: "mayssa@reduzsiminss.com.br",
  name: "Mayssa",
  role: "admin",
  sessionVersion: 3,
};

function environment() {
  return {
    SESSION_SECRET: "test-only-session-secret-with-more-than-32-characters",
    DB: {
      prepare() {
        return {
          bind() {
            return {
              async first() {
                return {
                  id: sessionUser.id,
                  firebase_uid: sessionUser.firebaseUid,
                  email: sessionUser.email,
                  name: sessionUser.name,
                  role: sessionUser.role,
                  enabled: 1,
                  session_version: sessionUser.sessionVersion,
                };
              },
            };
          },
        };
      },
    },
  };
}

test("creates and validates a protected session cookie", async () => {
  const env = environment();
  const serialized = await createSessionCookie(sessionUser, env);
  assert.match(serialized, /HttpOnly/);
  assert.match(serialized, /Secure/);
  assert.match(serialized, /SameSite=Strict/);

  const request = new Request("https://crm.example.test/", {
    headers: { Cookie: serialized.split(";")[0] },
  });
  const restored = await readSession(request, env);
  assert.deepEqual(restored, sessionUser);
});

test("rejects a tampered session cookie", async () => {
  const env = environment();
  const serialized = await createSessionCookie(sessionUser, env);
  const [name, value] = serialized.split(";")[0].split("=");
  const [payload, signature] = value.split(".");
  const replacement = signature[0] === "a" ? "b" : "a";
  const tampered = `${name}=${payload}.${replacement}${signature.slice(1)}`;
  const request = new Request("https://crm.example.test/", {
    headers: { Cookie: tampered },
  });
  assert.equal(await readSession(request, env), null);
});

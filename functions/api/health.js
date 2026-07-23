import { jsonResponse } from "../lib/http.js";

export async function onRequestGet(context) {
  const user = context.data?.user;
  if (!user) {
    return jsonResponse({ ok: false, code: "UNAUTHORIZED" }, 401);
  }

  try {
    const database = await context.env.DB.prepare("SELECT 1 AS ready").first();
    return jsonResponse({
      ok: Number(database?.ready) === 1,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    return jsonResponse({ ok: false, code: "DB_UNAVAILABLE" }, 503);
  }
}


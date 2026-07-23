import { isTrustedMutation, jsonResponse } from "../lib/http.js";

const MAX_IDS = 500;
const ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

export async function onRequestPost(context) {
  const { request, env } = context;
  const user = context.data?.user;
  if (!user) {
    return jsonResponse({ error: "Autenticacao necessaria.", code: "UNAUTHORIZED" }, 401);
  }
  if (!isTrustedMutation(request)) {
    return jsonResponse({ error: "Origem da solicitacao invalida.", code: "INVALID_ORIGIN" }, 403);
  }

  const contentType = String(request.headers.get("Content-Type") || "").toLowerCase();
  if (!contentType.startsWith("application/json")) {
    return jsonResponse({ error: "Envie os dados em JSON.", code: "INVALID_CONTENT_TYPE" }, 415);
  }

  try {
    const body = await request.json();
    const now = new Date().toISOString();
    let result;

    if (body?.all === true) {
      result = await env.DB.prepare(`
        INSERT OR IGNORE INTO activity_reads (activity_id, user_id, read_at)
        SELECT id, ?, ?
        FROM activities
        WHERE deleted_at IS NULL
          AND (? = 'admin' OR scope = 'team')
      `).bind(user.id, now, user.role).run();
    } else {
      const ids = [...new Set(Array.isArray(body?.ids) ? body.ids.map(String) : [])];
      if (!ids.length || ids.length > MAX_IDS || ids.some((id) => !ID_PATTERN.test(id))) {
        return jsonResponse({ error: "Lista de atualizacoes invalida.", code: "INVALID_IDS" }, 400);
      }

      result = await env.DB.prepare(`
        INSERT OR IGNORE INTO activity_reads (activity_id, user_id, read_at)
        SELECT activities.id, ?, ?
        FROM activities
        INNER JOIN json_each(?) requested ON requested.value = activities.id
        WHERE activities.deleted_at IS NULL
          AND (? = 'admin' OR activities.scope = 'team')
      `).bind(user.id, now, JSON.stringify(ids), user.role).run();
    }

    return jsonResponse({
      ok: true,
      marked: Number(result.meta?.changes || 0),
    });
  } catch (error) {
    console.error("Activity read update failed", error);
    return jsonResponse({
      error: "Nao foi possivel marcar as atualizacoes como lidas.",
      code: "ACTIVITY_READ_FAILED",
    }, 500);
  }
}

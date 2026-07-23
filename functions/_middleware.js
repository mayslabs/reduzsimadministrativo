import {
  isTrustedMutation,
  jsonResponse,
  redirectResponse,
  sanitizeNext,
  secureResponse,
} from "./lib/http.js";
import {
  clearSessionCookie,
  createSessionCookie,
  exchangeFirebaseToken,
  readSession,
} from "./lib/auth.js";

const PUBLIC_PATHS = new Set([
  "/login",
  "/login.html",
  "/login.js",
  "/favicon.ico",
  "/assets/favicon.png",
  "/assets/apple-touch-icon.png",
  "/assets/reduzsim-logo.png",
  "/assets/reduzsim-sidebar-logo.png",
]);

export async function onRequest(context) {
  const url = new URL(context.request.url);

  try {
    if (url.pathname === "/auth/session") return await handleSessionExchange(context);
    if (url.pathname === "/auth/logout") return handleLogout(context.request);

    if (PUBLIC_PATHS.has(url.pathname)) {
      if (url.pathname === "/login" || url.pathname === "/login.html") {
        const existingSession = await readSession(context.request, context.env);
        if (existingSession) return redirectResponse(sanitizeNext(url.searchParams.get("next")));
      }
      return secureResponse(await context.next());
    }

    const user = await readSession(context.request, context.env);
    if (!user) {
      if (url.pathname.startsWith("/api/")) {
        return jsonResponse({ error: "Autenticacao necessaria.", code: "UNAUTHORIZED" }, 401);
      }

      const next = sanitizeNext(`${url.pathname}${url.search}`);
      return redirectResponse(`/login?next=${encodeURIComponent(next)}`);
    }

    context.data.user = user;
    return secureResponse(await context.next());
  } catch (error) {
    console.error("Authentication middleware error", error);
    if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) {
      return jsonResponse({ error: "Nao foi possivel validar o acesso.", code: "AUTH_UNAVAILABLE" }, 503);
    }
    return redirectResponse("/login");
  }
}

async function handleSessionExchange(context) {
  const { request, env } = context;
  if (request.method !== "POST") {
    return jsonResponse({ error: "Metodo nao permitido.", code: "METHOD_NOT_ALLOWED" }, 405, {
      Allow: "POST",
    });
  }
  if (!isTrustedMutation(request)) {
    return jsonResponse({ error: "Origem da solicitacao invalida.", code: "INVALID_ORIGIN" }, 403);
  }

  const contentType = String(request.headers.get("Content-Type") || "").toLowerCase();
  if (!contentType.startsWith("application/json")) {
    return jsonResponse({ error: "Envie os dados em JSON.", code: "INVALID_CONTENT_TYPE" }, 415);
  }

  const body = await request.json();
  const idToken = String(body?.idToken || "");
  if (!idToken || idToken.length > 10000) {
    return jsonResponse({ error: "Token de acesso invalido.", code: "INVALID_TOKEN" }, 400);
  }

  let user;
  try {
    user = await exchangeFirebaseToken(idToken, env);
  } catch (error) {
    console.warn("Firebase token verification failed");
    return jsonResponse({ error: "Token de acesso invalido.", code: "INVALID_TOKEN" }, 401);
  }
  if (!user) {
    return jsonResponse({ error: "Este usuario nao esta autorizado.", code: "FORBIDDEN" }, 403);
  }

  const cookie = await createSessionCookie(user, env);
  return jsonResponse({
    ok: true,
    user: publicUser(user),
  }, 200, {
    "Set-Cookie": cookie,
  });
}

function handleLogout(request) {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Metodo nao permitido.", code: "METHOD_NOT_ALLOWED" }, 405, {
      Allow: "POST",
    });
  }
  if (!isTrustedMutation(request)) {
    return jsonResponse({ error: "Origem da solicitacao invalida.", code: "INVALID_ORIGIN" }, 403);
  }
  return jsonResponse({ ok: true }, 200, {
    "Set-Cookie": clearSessionCookie(),
  });
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

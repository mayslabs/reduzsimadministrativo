const APP_CSP = [
  "default-src 'self'",
  "script-src 'self' https://www.gstatic.com https://unpkg.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data:",
  "connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "worker-src 'none'",
  "manifest-src 'self'",
  "media-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

export function secureResponse(response) {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "private, no-store, max-age=0");
  headers.set("Content-Security-Policy", APP_CSP);
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  headers.set("Cross-Origin-Resource-Policy", "same-origin");
  headers.set("Permissions-Policy", "camera=(), geolocation=(), microphone=(), payment=(), usb=()");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function jsonResponse(body, status = 200, extraHeaders = {}) {
  return secureResponse(new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  }));
}

export function textResponse(message, status = 200, extraHeaders = {}) {
  return secureResponse(new Response(message, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      ...extraHeaders,
    },
  }));
}

export function redirectResponse(location, extraHeaders = {}) {
  return secureResponse(new Response(null, {
    status: 303,
    headers: {
      Location: location,
      ...extraHeaders,
    },
  }));
}

export function isTrustedMutation(request) {
  const fetchSite = String(request.headers.get("Sec-Fetch-Site") || "").toLowerCase();
  if (fetchSite) return fetchSite === "same-origin" || fetchSite === "none";

  const origin = request.headers.get("Origin");
  if (!origin || origin === "null") return false;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch (error) {
    return false;
  }
}

export function sanitizeNext(value) {
  const next = String(value || "/").trim();
  if (!next.startsWith("/") || next.startsWith("//")) return "/";
  if (next.startsWith("/auth/") || next.startsWith("/login")) return "/";
  return next.slice(0, 1200);
}


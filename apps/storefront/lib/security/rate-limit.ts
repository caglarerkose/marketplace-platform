import "server-only";
import { createHash } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const fallbackLimits = new Map<string, { count: number; startedAt: number }>();

function consumeFallbackLimit(
  key: string,
  limit: number,
  windowSeconds: number,
) {
  const now = Date.now();
  const current = fallbackLimits.get(key);
  if (!current || current.startedAt + windowSeconds * 1000 <= now) {
    fallbackLimits.set(key, { count: 1, startedAt: now });
    return { allowed: true, retryAfter: 0, unavailable: false };
  }
  current.count += 1;
  fallbackLimits.set(key, current);
  return {
    allowed: current.count <= limit,
    retryAfter: Math.max(
      1,
      Math.ceil((current.startedAt + windowSeconds * 1000 - now) / 1000),
    ),
    unavailable: false,
  };
}
export async function checkRateLimit(
  request: Request,
  scope: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
) {
  const forwarded =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown",
    hash = createHash("sha256")
      .update(`${scope}|${forwarded}|${identifier.trim().toLowerCase()}`)
      .digest("hex"),
    { data, error } = await createSupabaseAdminClient().rpc(
      "consume_api_rate_limit",
      {
        p_scope: scope,
        p_subject_hash: hash,
        p_limit: limit,
        p_window_seconds: windowSeconds,
      },
    );
  if (error) {
    console.error("rate_limit_rpc_failed", {
      scope,
      code: error.code,
    });
    return consumeFallbackLimit(scope + ":" + hash, limit, windowSeconds);
  }
  const row = data?.[0];
  return {
    allowed: Boolean(row?.allowed),
    retryAfter: Number(row?.retry_after_seconds || 0),
    unavailable: false,
  };
}

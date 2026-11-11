import { supabase } from "@/integrations/supabase/client";

let cachedIp: string | null = null;
let ipPromise: Promise<string | null> | null = null;

export async function getVisitorIp(): Promise<string | null> {
  if (cachedIp) return cachedIp;
  if (ipPromise) return ipPromise;
  ipPromise = (async () => {
    try {
      const r = await fetch("https://api.ipify.org?format=json");
      const j = await r.json();
      cachedIp = j?.ip ?? null;
      return cachedIp;
    } catch {
      return null;
    }
  })();
  return ipPromise;
}

function parseUA(ua: string): { browser: string; os: string } {
  let browser = "Desconhecido";
  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/OPR\//.test(ua)) browser = "Opera";
  else if (/Chrome\//.test(ua)) browser = "Chrome";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/Safari\//.test(ua)) browser = "Safari";

  let os = "Desconhecido";
  if (/Windows/.test(ua)) os = "Windows";
  else if (/Android/.test(ua)) os = "Android";
  else if (/iPhone|iPad|iOS/.test(ua)) os = "iOS";
  else if (/Mac OS X/.test(ua)) os = "macOS";
  else if (/Linux/.test(ua)) os = "Linux";
  return { browser, os };
}

export async function isVisitorBlocked(userId: string): Promise<boolean> {
  const ip = await getVisitorIp();
  if (!ip) return false;
  const { data } = await supabase
    .from("blocked_ips")
    .select("id")
    .eq("user_id", userId)
    .eq("ip", ip)
    .limit(1);
  return !!(data && data.length > 0);
}

export async function logVisitorActivity(
  userId: string,
  type: string,
  productSlug?: string,
  productName?: string,
  details?: string,
  productId?: string,
) {
  try {
    const ip = await getVisitorIp();
    const { browser, os } = parseUA(typeof navigator !== "undefined" ? navigator.userAgent : "");
    await supabase.from("activities").insert({
      user_id: userId,
      type,
      product_id: productId ?? null,
      product_name: productName ?? productSlug ?? null,
      ip,
      browser,
      os,
      details: details ?? null,
    } as any);
  } catch (e) {
    console.warn("activity log failed", e);
  }
}

export async function trackStat(_kind: string, _amount?: number, _slug?: string) {
  // no-op stub
}

export function markVisitorBlocked() {
  try {
    localStorage.setItem("olx_visitor_blocked", "1");
  } catch {}
}

export async function fetchProductBySlug(fullSlug: string) {
  const m = fullSlug.match(/^(.+)-(\d+)$/);
  let row: any = null;
  if (m) {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("slug", m[1])
      .eq("display_id", Number(m[2]))
      .limit(1);
    row = data?.[0] ?? null;
  }
  if (!row) {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("slug", fullSlug)
      .limit(1);
    row = data?.[0] ?? null;
  }
  if (!row) {
    // tolerant fallback: match by base slug (strip trailing -digits)
    const base = fullSlug.replace(/-\d+$/, "");
    if (base && base !== fullSlug) {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("slug", base)
        .limit(1);
      row = data?.[0] ?? null;
    }
  }
  if (!row) return null;
  if (await isVisitorBlocked(row.user_id)) return null;
  return row;
}

/**
 * Busca resiliente usada no checkout: tenta o slug e, se falhar (ou se o slug
 * nem chegou por causa de query string removida / localStorage bloqueado em
 * navegadores mobile), cai para o id do produto salvo no clique em "Comprar".
 */
export async function fetchCheckoutProduct(slug?: string | null) {
  if (slug) {
    const bySlug = await fetchProductBySlug(slug);
    if (bySlug) return bySlug;
  }
  let id: string | null = null;
  try {
    id = localStorage.getItem("olx_produto_id");
  } catch {
    id = null;
  }
  if (!id) return null;
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .limit(1);
  const row: any = data?.[0] ?? null;
  if (!row) return null;
  if (await isVisitorBlocked(row.user_id)) return null;
  return row;
}

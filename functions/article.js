export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id') || '';

  const ua = request.headers.get('user-agent') || '';
  const isCrawler =
    /facebookexternalhit|Facebot|Twitterbot|WhatsApp|TelegramBot/i.test(ua);

  // ===== FAST PATH UNTUK CRAWLER (FB / WA / Telegram) =====
  if (isCrawler && id) {
    const data = await fetch(
      'https://bg-news-api.playpotel.workers.dev/',
      {
        cf: {
          cacheEverything: true,
          cacheTtl: 1800 // 30 menit
        }
      }
    ).then(r => r.json());

    function articleId(link) {
      let h = 0;
      for (let i = 0; i < link.length; i++) {
        h = ((h << 5) - h) + link.charCodeAt(i);
        h |= 0;
      }
      return Math.abs(h).toString();
    }

    const item = data.items.find(x => articleId(x.link) === id);

    if (!item) {
      return new Response(
        '<!doctype html><html><head><title>BG News</title></head></html>',
        { headers: { 'Content-Type': 'text/html; charset=UTF-8' } }
      );
    }

    const imgMatch = item.description?.match(
      /<img[^>]+src=["']([^"']+)["']/i
    );

    const image = imgMatch
      ? imgMatch[1]
      : 'https://bgnews.pages.dev/og-default.jpg';

    const desc = item.description
      ? item.description.replace(/<[^>]+>/g, '').slice(0, 160)
      : '';

    // HTML super ringan (crawler TIDAK sabar)
    const html = `<!doctype html>
<html lang="bg">
<head>
<meta charset="utf-8">
<title>${item.title}</title>

<meta property="og:type" content="article">
<meta property="og:title" content="${item.title}">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="${image}">
<meta property="og:site_name" content="BG News">

</head>
<body></body>
</html>`;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=UTF-8',
        'Cache-Control': 'public, max-age=1800'
      }
    });
  }

  // ===== PATH NORMAL (USER MANUSIA) =====
  // Ambil article.html statis → JS + Ads jalan normal
  const res = await env.ASSETS.fetch(request);

  return new Response(await res.text(), {
    headers: {
      'Content-Type': 'text/html; charset=UTF-8'
    }
  });
}

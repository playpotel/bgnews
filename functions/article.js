export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  // Ambil HTML asli
  const res = await env.ASSETS.fetch(request);
  let html = await res.text();

  if (!id) {
    return new Response(html, { headers: { 'Content-Type': 'text/html' } });
  }

  const data = await fetch(
  'https://bg-news-api.playpotel.workers.dev/',
  {
    cf: {
      cacheTtl: 600,
      cacheEverything: true
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
    return new Response(html, { headers: { 'Content-Type': 'text/html' } });
  }

  const imgMatch = item.description?.match(/<img[^>]+src=["']([^"']+)["']/i);
  const image = imgMatch
    ? imgMatch[1]
    : 'https://bgnews.pages.dev/og-default.jpg';

  const desc = item.description
    ? item.description.replace(/<[^>]+>/g, '').slice(0, 160)
    : '';

  html = html
    .replace(/<meta property="og:title"[^>]*>/,
      `<meta property="og:title" content="${item.title}">`)
    .replace(/<meta property="og:description"[^>]*>/,
      `<meta property="og:description" content="${desc}">`)
    .replace(/<meta property="og:image"[^>]*>/,
      `<meta property="og:image" content="${image}">`);

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=UTF-8' }
  });
}

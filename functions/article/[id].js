export async function onRequest({ request, env }) {
  const url = new URL(request.url);

  // paksa semua /article/* diarahkan ke /article.html
  url.pathname = '/article.html';

  return env.ASSETS.fetch(new Request(url.toString(), request));
}

export async function onRequest({ request, env }) {
  const url = new URL(request.url);

  // arahkan ke /article/index.html (AMAN dari Clean URL redirect)
  url.pathname = '/article/index.html';

  return env.ASSETS.fetch(new Request(url.toString(), request));
}

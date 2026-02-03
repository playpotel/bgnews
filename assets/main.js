const API = 'https://bg-news-api.playpotel.workers.dev/';
const CACHE_KEY = 'bgnews_api';
const CACHE_TTL = 5 * 60 * 1000;

/* =========================
   UTIL
========================= */
function articleId(link) {
  let h = 0;
  for (let i = 0; i < link.length; i++) {
    h = ((h << 5) - h) + link.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString();
}

function extractImage(html) {
  if (!html) return null;
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : null;
}

/* =========================
   HOMEPAGE
========================= */
async function loadHomepage() {
  const container = document.getElementById('news');
  if (!container) return;

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const ts = localStorage.getItem(CACHE_KEY + '_ts');

    let data;
    if (cached && ts && Date.now() - ts < CACHE_TTL) {
      data = JSON.parse(cached);
    } else {
      const res = await fetch(API);
      data = await res.json();
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(CACHE_KEY + '_ts', Date.now());
    }

    container.innerHTML = '';

    data.items.forEach(item => {
      const id = articleId(item.link);
      const el = document.createElement('article');

      el.innerHTML = `
        <span class="badge">${item.source || ''}</span>
        <h2>${item.title}</h2>
        <div class="meta">
          ${new Date(item.pubDate).toLocaleString('bg-BG')}
        </div>
        <p>${item.description || ''}</p>
        <a href="/article.html?id=${id}">Прочети още →</a>
      `;

      container.appendChild(el);
    });
  } catch (e) {
    container.textContent = 'Грешка при зареждане';
    console.error(e);
  }

  // auto refresh
  setInterval(() => {
    localStorage.removeItem(CACHE_KEY);
    loadHomepage();
  }, 5 * 60 * 1000);
}

/* =========================
   ARTICLE PAGE
========================= */
async function loadArticle() {
  const container = document.getElementById('article');
  if (!container) return;

  const params = new URLSearchParams(location.search);
  const id = params.get('id');

  if (!id) {
    container.textContent = 'Няма статия';
    return;
  }

  try {
    const res = await fetch(API);
    const data = await res.json();
    const item = data.items.find(x => articleId(x.link) === id);

    if (!item) {
      container.textContent = 'Статията не е намерена';
      return;
    }

    document.title = item.title;

    container.innerHTML = `
      <h1>${item.title}</h1>
      <div class="meta">
        ${item.source || ''} · ${new Date(item.pubDate).toLocaleString('bg-BG')}
      </div>
      <p>${item.description || ''}</p>
      <a class="original" href="${item.link}" target="_blank">
        Прочети оригинала →
      </a>
    `;

    setTimeout(loadAds, 1500);

  } catch (e) {
    container.textContent = 'Грешка при зареждане';
    console.error(e);
  }
}

/* =========================
   ADS
========================= */
function loadAds() {
  const ad = document.getElementById('ad');
  if (!ad) return;

  const s1 = document.createElement('script');
  s1.text = `
    atOptions = {
      'key' : 'dff5c4c5dd22bf5b09bab809923da74a',
      'format' : 'iframe',
      'height' : 250,
      'width' : 300,
      'params' : {}
    };
  `;

  const s2 = document.createElement('script');
  s2.src = 'https://tuckerclassesjackal.com/dff5c4c5dd22bf5b09bab809923da74a/invoke.js';

  ad.appendChild(s1);
  ad.appendChild(s2);
}

/* =========================
   INIT
========================= */
document.addEventListener('DOMContentLoaded', () => {
  loadHomepage();
  loadArticle();
});

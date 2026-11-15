// Pure logic, no DOM: runs in the browser and in node tests.

// Never read private messages, whatever the export calls them.
const SKIP_KEY = /direct ?message|chat/i;
const TAG_URL = /tiktok\.com\/tag\/([^/?#\s]+)/i;

// TikTok's export schema changes between versions, so walk the whole tree
// and pick fields by key name instead of hard-coding paths.
export function extractSignals(data) {
  const s = { searches: [], following: [], comments: [], hashtags: [], bio: '' };
  (function walk(node, path) {
    if (Array.isArray(node)) return node.forEach((n) => walk(n, path));
    if (!node || typeof node !== 'object') return;
    for (const [k, v] of Object.entries(node)) {
      if (SKIP_KEY.test(k)) continue;
      const p = `${path}/${k}`;
      if (typeof v !== 'string') { walk(v, p); continue; }
      const val = v.trim();
      if (!val) continue;
      const tag = val.match(TAG_URL);
      if (tag) s.hashtags.push(decodeURIComponent(tag[1]));
      else if (/^search ?term$/i.test(k)) s.searches.push(val);
      else if (/^user ?name$/i.test(k) && /following/i.test(path)) s.following.push(val);
      else if (/^comment$/i.test(k)) s.comments.push(val);
      else if (/^bio/i.test(k)) s.bio = val;
    }
  })(data, '');
  return s;
}

// Most frequent first, case-insensitive.
export function top(list, n) {
  const counts = new Map();
  for (const item of list) {
    const key = item.toLowerCase();
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1]).slice(0, n);
}

export function isEmpty(s) {
  return !s.searches.length && !s.following.length && !s.comments.length && !s.hashtags.length && !s.bio;
}

export function buildPrompt(s) {
  const fmt = (pairs) => pairs.map(([t, c]) => (c > 1 ? `${t} (${c})` : t)).join(', ') || '-';
  const comments = [...new Set(s.comments)].slice(0, 25).map((c) => `- ${c}`).join('\n') || '-';
  return `Sen yaratıcı bir tarot sanatçısı ve yorumcususun. Aşağıda bir kişinin TikTok kullanım verilerinden çıkarılmış sinyaller var.

## Sinyaller
Bio: ${s.bio || '-'}
En çok aradıkları: ${fmt(top(s.searches, 40))}
Favori hashtagler: ${fmt(top(s.hashtags, 25))}
Takip ettiği hesaplar (örnek): ${fmt(top(s.following, 40))}
Yazdığı yorumlardan örnekler:
${comments}

## Görev
1. Bu sinyallerden kişinin 3-5 ana ilgi alanını ve ruh halini çıkar. Kısa bir liste yap.
2. Bu ilgi alanlarından beslenen, tamamen ÖZGÜN bir tarot kartı icat et: kartın adı, numarası (Büyük Arkana tarzı), sembolleri ve anlamı.
3. Kartın görselini üret: dikey 2:3 oran, süslü tarot çerçevesi, altta kartın adı yazsın, ilgi alanları sembollerle kartın içine işlensin.
4. Kişiye özel, sıcak ve biraz gizemli bir okuma yaz (Türkçe, 150-200 kelime): kartın düz anlamı, ters anlamı ve bugün için bir tavsiye.

Gerçek kişi isimlerini ya da hassas bilgileri karta yazma.`;
}

import { extractSignals, isEmpty, buildPrompt } from './core.js';

const $ = (id) => document.getElementById(id);
const KEY = 'tiktok-tarot-signals';

async function readExport(file) {
  if (/\.zip$/i.test(file.name)) {
    const zip = await JSZip.loadAsync(file);
    const jsons = Object.values(zip.files).filter((f) => !f.dir && /\.json$/i.test(f.name));
    if (!jsons.length) throw new Error('Zip içinde JSON yok. TikTok\'tan veriyi JSON formatında iste.');
    return Promise.all(jsons.map(async (f) => JSON.parse(await f.async('string'))));
  }
  return JSON.parse(await file.text());
}

function show(signals) {
  $('stats').textContent =
    `${signals.searches.length} arama · ${signals.hashtags.length} hashtag · ` +
    `${signals.following.length} takip · ${signals.comments.length} yorum`;
  $('prompt').value = buildPrompt(signals);
  $('result').hidden = false;
}

function status(msg, isError = false) {
  $('status').textContent = msg;
  $('status').classList.toggle('error', isError);
}

$('file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  status('Okunuyor…');
  try {
    const signals = extractSignals(await readExport(file));
    if (isEmpty(signals)) throw new Error('Dosyada arama, takip, hashtag ya da yorum bulunamadı. Doğru dosya mı?');
    try { localStorage.setItem(KEY, JSON.stringify(signals)); } catch {}
    show(signals);
    status('Hazır. Dosyan bu cihazdan çıkmadı.');
  } catch (err) {
    status(err instanceof SyntaxError ? 'Dosya okunamadı. JSON formatında export olduğundan emin ol.' : err.message, true);
  }
});

$('copy').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText($('prompt').value);
  } catch {
    $('prompt').select();
    document.execCommand('copy');
  }
  $('copy').textContent = 'Kopyalandı ✓';
  setTimeout(() => ($('copy').textContent = 'Prompt\'u kopyala'), 1500);
});

$('clear').addEventListener('click', () => {
  try { localStorage.removeItem(KEY); } catch {}
  $('result').hidden = true;
  $('file').value = '';
  status('Kaydedilen veriler silindi.');
});

try {
  const saved = JSON.parse(localStorage.getItem(KEY));
  if (saved) { show(saved); status('Önceki verilerin yüklendi.'); }
} catch {}

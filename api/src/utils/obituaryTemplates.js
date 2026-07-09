// api/src/utils/obituaryTemplates.js
//
// Builds the print-ready HTML for an obituary, rendered to PDF by Puppeteer.
// SINGLE SOURCE OF TRUTH for the PDF. components/obituary/ObituaryPreview.tsx
// mirrors this for the on-screen preview — keep the two visually in sync.
//
// ORIENTATION: d1/d2 are A4 portrait, d3/d4 are A4 landscape.
//
// IMAGES: both the theme background and the portrait are read from disk and
// inlined as base64 data URIs. This avoids Puppeteer's flaky file:// loading
// inside setContent() (which was rendering blank images).
//
// BACKGROUNDS live in api/uploads/obituary/backgrounds/ (singular).

const fs = require('fs');
const path = require('path');

const BACKGROUND_DIR = path.join(__dirname, '..', '..', 'uploads', 'obituary', 'backgrounds');

const THEME_CONFIG = {
  d1: { label: 'Heaven Gates', accent: '#3f7cac', background: 'theme1-heaven-gates.jpg', orientation: 'portrait' },
  d2: { label: 'Floral',       accent: '#4b5563', background: 'theme2-floral-bw.jpg',   orientation: 'portrait' },
  d3: { label: 'Gold Frame',   accent: '#b08d57', background: 'theme3-gold-frame.jpg',  orientation: 'landscape' },
  d4: { label: 'Peach Floral', accent: '#c2724f', background: 'theme4-peach-floral.jpg', orientation: 'landscape' },
};

function mimeFromExt(p) {
  const e = path.extname(p).toLowerCase();
  if (e === '.png') return 'image/png';
  if (e === '.webp') return 'image/webp';
  if (e === '.gif') return 'image/gif';
  if (e === '.svg') return 'image/svg+xml';
  return 'image/jpeg';
}

// Read an image file and return a base64 data URI (or null if missing).
function toDataUri(absPath) {
  try {
    if (!absPath || !fs.existsSync(absPath)) return null;
    const buf = fs.readFileSync(absPath);
    return `data:${mimeFromExt(absPath)};base64,${buf.toString('base64')}`;
  } catch (e) {
    console.error('toDataUri error for', absPath, e.message);
    return null;
  }
}

function esc(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return esc(value);
  return d.toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' });
}

function calcAge(born, passed) {
  if (!born || !passed) return '';
  const b = new Date(born); const p = new Date(passed);
  if (Number.isNaN(b.getTime()) || Number.isNaN(p.getTime())) return '';
  let age = p.getFullYear() - b.getFullYear();
  const m = p.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && p.getDate() < b.getDate())) age--;
  return age >= 0 ? String(age) : '';
}

function buildObituaryHtml(data, assets = {}) {
  const theme = THEME_CONFIG[data.mf_theme] || THEME_CONFIG.d1;
  const accent = theme.accent;
  const landscape = theme.orientation === 'landscape';

  // Inline both images as base64 data URIs.
  const bgUri = toDataUri(theme.background ? path.join(BACKGROUND_DIR, theme.background) : null);
  const portraitUri = toDataUri(assets.portraitAbsPath);

  const age = calcAge(data.mf_born, data.mf_pass_date);
  const bornLoc = data['mf-born_location'] || data.mf_born_location || '';

  const pageW = landscape ? '297mm' : '210mm';
  const pageH = landscape ? '210mm' : '297mm';
  const cardMaxW = landscape ? '170mm' : '150mm';

  const bgLayer = bgUri
    ? `background-image:url('${bgUri}');background-size:cover;background-position:center;`
    : 'background:#ffffff;';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  @page { size: A4 ${landscape ? 'landscape' : 'portrait'}; margin: 0; }
  html, body { width:${pageW}; height:${pageH}; }
  body { font-family: 'Georgia', 'Times New Roman', serif; color:#1a1a1a; }
  .page {
    width:${pageW}; height:${pageH}; ${bgLayer}
    display:flex; align-items:center; justify-content:center;
    padding: 16mm;
  }
  .card {
    width:100%; max-width:${cardMaxW};
    background: rgba(255,255,255,${bgUri ? '0.88' : '1'});
    border-radius: 8px; padding: 14mm 12mm; text-align:center;
  }
  .prayer { font-style: italic; font-size: 12.5pt; line-height:1.6; color:#444; margin: 0 4mm 6mm; }
  .portrait {
    width: 38mm; height: 38mm; border-radius: 50%; object-fit: cover;
    border: 3px solid ${accent}; margin: 0 auto 5mm; display:block;
  }
  .portrait-fallback {
    width: 38mm; height: 38mm; border-radius: 50%; margin: 0 auto 5mm;
    background:#f0f0f0; border:3px solid ${accent};
  }
  .name { font-size: 21pt; font-weight: bold; color:${accent}; }
  .lifespan { font-size: 11.5pt; color:#555; margin-top: 2mm; }
  .quote { font-style: italic; font-size: 11.5pt; color:#444; margin: 5mm 6mm; }
  .rule { border:0; border-top:1px solid ${accent}; opacity:.4; margin: 6mm 0; }
  .section-title {
    font-size: 11.5pt; font-weight: bold; color:${accent};
    text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2mm;
  }
  .section { margin-bottom: 6mm; }
  .section p { font-size: 10.5pt; line-height:1.6; color:#333; }
  .further { display:flex; gap: 8mm; text-align:left; margin-top: 5mm; }
  .further > div { flex:1; font-size: 10pt; line-height:1.6; color:#333; white-space:pre-wrap; }
</style>
</head>
<body>
  <div class="page">
    <div class="card">
      ${data.md_content ? `<div class="prayer">${esc(data.md_content)}</div>` : ''}
      ${portraitUri
        ? `<img class="portrait" src="${portraitUri}" alt="portrait" />`
        : `<div class="portrait-fallback"></div>`}
      <div class="name">${esc(data.mf_fullname)}</div>
      <div class="lifespan">
        ${formatDate(data.mf_born)}${bornLoc ? ` (${esc(bornLoc)})` : ''}
        &nbsp;&ndash;&nbsp;
        ${formatDate(data.mf_pass_date)}${data.mf_pass_location ? ` (${esc(data.mf_pass_location)})` : ''}
        ${age ? `&nbsp;&nbsp;(Age ${age})` : ''}
      </div>
      ${data.mf_quote ? `<div class="quote">${esc(data.mf_quote)}</div>` : ''}

      <hr class="rule" />

      ${(data.mf_wake_dtl_til || data.mf_wake_dtl_add) ? `
      <div class="section">
        <div class="section-title">Wake Details</div>
        <p>${esc(data.mf_wake_dtl_til)} is resting peacefully at</p>
        <p>${esc(data.mf_wake_dtl_add)}</p>
      </div>` : ''}

      ${(data.mf_cortehe_on || data.mf_location_funeral) ? `
      <div class="section">
        <div class="section-title">Funeral Details</div>
        <p>Cortege will leave on ${formatDate(data.mf_cortehe_on)}</p>
        <p>${esc(data.mf_location_funeral)}</p>
      </div>` : ''}

      ${(data.mf_further_dtl || data.mf_further_dtl2) ? `
      <div class="further">
        <div>${esc(data.mf_further_dtl)}</div>
        <div>${esc(data.mf_further_dtl2)}</div>
      </div>` : ''}
    </div>
  </div>
</body>
</html>`;
}

module.exports = { buildObituaryHtml, THEME_CONFIG, BACKGROUND_DIR, calcAge };
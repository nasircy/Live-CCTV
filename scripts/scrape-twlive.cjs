const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const TEMP_DIR = path.join(process.env.LOCALAPPDATA, 'Temp');
const IDS_FILE = path.join(TEMP_DIR, 'twlive-ids.json');
const OUTPUT_FILE = path.join(TEMP_DIR, 'NY-Live-CCTV', 'twlive-cams.json');
const CONCURRENCY = 20;
const DELAY_MS = 50;
const RETRY = 2;

function fetch(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout }, (res) => {
      if (res.statusCode !== 200) { res.resume(); return reject(new Error(`HTTP ${res.statusCode}`)); }
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(d));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function extractUrl(html) {
  const m1 = html.match(/data-original-src="([^"]+)"/);
  if (m1) return m1[1].replace(/&amp;/g, '&');
  const m2 = html.match(/contentUrl"\s*:\s*"([^"]+)"/);
  if (m2) return m2[1].replace(/&amp;/g, '&');
  const m3 = html.match(/<source src="([^"]+)"/);
  if (m3) return m3[1].replace(/&amp;/g, '&');
  const m4 = html.match(/src="([^"]+\.jpg[^"]*)"/);
  if (m4) return m4[1].replace(/&amp;/g, '&');
  return null;
}

function extractMeta(html) {
  const nameM = html.match(/data-cam-name="([^"]+)"/);
  const srcM = html.match(/src_name:\s*'([^']+)'/);
  const typeM = html.match(/cam_type:\s*'([^']+)'/);
  return {
    name: nameM ? nameM[1] : '',
    src: srcM ? srcM[1] : '',
    type: typeM ? typeM[1] : ''
  };
}

async function scrapeOne(id, retries = RETRY) {
  const url = `https://tw.live/cam/?id=${encodeURIComponent(id)}`;
  try {
    const html = await fetch(url);
    const camUrl = extractUrl(html);
    const meta = extractMeta(html);
    return { id, url: camUrl, ...meta };
  } catch (e) {
    if (retries > 0) return scrapeOne(id, retries - 1);
    return { id, url: null, name: '', src: '', type: '', error: e.message };
  }
}

async function runBatch(ids, start, batchSize) {
  const batch = ids.slice(start, start + batchSize);
  return Promise.all(batch.map(id => scrapeOne(id)));
}

async function main() {
  const ids = JSON.parse(fs.readFileSync(IDS_FILE, 'utf8'));
  console.log(`Total IDs: ${ids.length}`);
  const results = [];
  let done = 0;
  let found = 0;

  for (let i = 0; i < ids.length; i += CONCURRENCY) {
    const batch = await runBatch(ids, i, CONCURRENCY);
    for (const r of batch) {
      results.push(r);
      done++;
      if (r.url) found++;
    }
    if (done % 200 === 0 || done === ids.length) {
      console.log(`Progress: ${done}/${ids.length} (${found} URLs found)`);
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 0));
    }
    if (i + CONCURRENCY < ids.length) await new Promise(r => setTimeout(r, DELAY_MS));
  }

  console.log(`\nDone! Total: ${results.length}, Found: ${found}`);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
}

main().catch(console.error);

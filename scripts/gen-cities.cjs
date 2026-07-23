const fs = require('fs');
const path = require('path');
const dataDir = path.join(__dirname, '..', 'src', 'data');
const regions = JSON.parse(fs.readFileSync(path.join(dataDir, 'regions.json'), 'utf-8'));

const allCams = [];
for (const [name, info] of Object.entries(regions)) {
  const cams = JSON.parse(fs.readFileSync(path.join(dataDir, info.file), 'utf-8'));
  allCams.push(...cams);
}

const cityExpand = {
  '新竹縣市': ['新竹縣', '新竹市'],
  '嘉義縣市': ['嘉義縣', '嘉義市'],
};

const cityMap = {};
allCams.forEach(cam => {
  let parts = cam.city.split('/').map(s => s.trim()).filter(Boolean);
  const expanded = [];
  parts.forEach(p => {
    if (cityExpand[p]) expanded.push(...cityExpand[p]);
    else expanded.push(p);
  });
  const unique = [...new Set(expanded)];
  unique.forEach(city => {
    if (!cityMap[city]) cityMap[city] = [];
    cityMap[city].push(cam);
  });
});

const order = ['台北市','新北市','基隆市','桃園市','新竹縣','新竹市','苗栗縣','台中市','彰化縣','南投縣','雲林縣','嘉義縣','嘉義市','台南市','高雄市','屏東縣','台東縣','宜蘭縣'];
const sorted = Object.entries(cityMap).sort((a,b) => {
  const ia = order.indexOf(a[0]);
  const ib = order.indexOf(b[0]);
  return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
});

const newRegions = {};
sorted.forEach(([city, cams]) => {
  const fileName = city + '.json';
  fs.writeFileSync(path.join(dataDir, fileName), JSON.stringify(cams, null, 2), 'utf-8');
  newRegions[city] = { count: cams.length, file: fileName };
});

fs.writeFileSync(path.join(dataDir, 'regions.json'), JSON.stringify(newRegions, null, 2), 'utf-8');

const publicDir = path.join(__dirname, '..', 'public', 'data');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
fs.copyFileSync(path.join(dataDir, 'regions.json'), path.join(publicDir, 'regions.json'));
sorted.forEach(([city]) => {
  const src = path.join(dataDir, city + '.json');
  const dst = path.join(publicDir, city + '.json');
  if (fs.existsSync(src)) fs.copyFileSync(src, dst);
});

console.log('Generated', Object.keys(newRegions).length, 'city files');
let total = 0;
Object.entries(newRegions).forEach(([k,v]) => { console.log('  ' + k + ':', v.count); total += v.count; });
console.log('Total (with overlaps):', total);
console.log('Unique cameras:', allCams.length);

const fs = require('fs');
const path = require('path');
const dataDir = path.join(__dirname, '..', 'src', 'data');
const regions = JSON.parse(fs.readFileSync(path.join(dataDir, 'regions.json'), 'utf-8'));

const allCams = [];
const seen = new Set();
for (const [city, info] of Object.entries(regions)) {
  const cams = JSON.parse(fs.readFileSync(path.join(dataDir, info.file), 'utf-8'));
  cams.forEach(cam => {
    const key = cam.name + '|' + cam.url;
    if (!seen.has(key)) {
      seen.add(key);
      allCams.push(cam);
    }
  });
}

allCams.sort((a,b) => a.id - b.id);
allCams.forEach((cam,i) => cam.id = i);

fs.writeFileSync(path.join(dataDir, 'cameras_thumb.json'), JSON.stringify(allCams), 'utf-8');
fs.copyFileSync(path.join(dataDir, 'cameras_thumb.json'), path.join(__dirname, '..', 'public', 'data', 'cameras_thumb.json'));
console.log('cameras_thumb.json:', allCams.length, 'cameras');

import { defineConfig } from 'astro/config';
import { copyFileSync } from 'fs';
import { resolve } from 'path';

function copyCamerasJson() {
  const src = resolve('src/data/cameras_thumb.json');
  const dest = resolve('public/cameras_thumb.json');
  try { copyFileSync(src, dest); } catch(e) {}
}

export default defineConfig({
  site: 'https://nasircy.github.io',
  base: '/Live-CCTV',
  vite: {
    buildStart: [copyCamerasJson]
  }
});

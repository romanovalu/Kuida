import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { resolve } from 'path';

const dist = resolve('dist');
const assets = resolve(dist, 'assets');

const files = readdirSync(assets);
const jsFile  = files.find(f => f.endsWith('.js'));
const cssFile = files.find(f => f.endsWith('.css'));

if (!jsFile || !cssFile) {
  console.error('Could not find JS or CSS in dist/assets'); process.exit(1);
}

const js  = readFileSync(resolve(assets, jsFile),  'utf8');
const css = readFileSync(resolve(assets, cssFile), 'utf8');

const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>GestiónTurnos</title>
  <style>${css}</style>
</head>
<body>
  <div id="root"></div>
  <script>${js}</script>
</body>
</html>`;

const outPath = resolve('bundle.html');
writeFileSync(outPath, html, 'utf8');
console.log(`✓ bundle.html written (${(html.length / 1024).toFixed(1)} kB)`);

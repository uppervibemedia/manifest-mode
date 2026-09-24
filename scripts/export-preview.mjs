import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
const root = 'dist-preview';
let html = readFileSync(join(root, 'preview.html'), 'utf8');
html = html.replace(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g, (_, src) => {
  const script = readFileSync(join(root, src.replace(/^\//, '')), 'utf8');
  return `<script type="module">${script.replaceAll('</script', '<\\/script')}</script>`;
});
html = html.replace(/<link\b[^>]*href="([^"]+\.css)"[^>]*>/g, (_, src) => {
  const css = readFileSync(join(root, src.replace(/^\//, '')), 'utf8').replace(/@import\s+url\([^)]*\);?/g, '');
  return `<style>${css}</style>`;
});
mkdirSync('artifacts', { recursive: true });
writeFileSync('artifacts/manifestmode-preview.html', html);
console.log('Exported artifacts/manifestmode-preview.html');

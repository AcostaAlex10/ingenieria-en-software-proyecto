// Empaqueta el sitio ya compilado en un unico .html, con el CSS y el JS
// incrustados. Sirve para compartir la demo como un archivo suelto: se abre con
// doble clic o se sube a cualquier visor, sin servidor ni carpeta de assets.
//
// Uso (desde FRONT/):
//   VITE_MOCK=1 VITE_HASH_ROUTER=1 ARCHIVO_UNICO=1 npm run build
//   node scripts/demo-un-archivo.mjs
//
// Requiere las tres variables: VITE_MOCK para que la app no llame al backend,
// VITE_HASH_ROUTER para que las rutas viajen en el fragmento y ARCHIVO_UNICO
// para que el JS salga en un solo bundle.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dist = 'dist';
const assets = join(dist, 'assets');

const archivos = readdirSync(assets);
const js = archivos.filter((f) => f.endsWith('.js'));
const css = archivos.filter((f) => f.endsWith('.css'));

if (js.length !== 1) {
  console.error(
    `Se esperaba un unico .js en dist/assets y hay ${js.length}: ${js.join(', ')}.\n` +
    'Faltó compilar con ARCHIVO_UNICO=1.'
  );
  process.exit(1);
}

const codigo = readFileSync(join(assets, js[0]), 'utf8');
const estilos = css.map((f) => readFileSync(join(assets, f), 'utf8')).join('\n');

// Un `</script` dentro de una cadena del bundle cerraria la etiqueta antes de
// tiempo, aunque venga con atributos o en mayusculas.
const seguro = (s) => s.replace(/<\/(script)/gi, '<\\/$1');

// El texto que se incrusta va SIEMPRE como funcion de reemplazo: pasarlo como
// cadena haria que replace() interprete los `$&`, `$1`, `` $` `` que aparecen en
// el codigo minificado como patrones, y los sustituya por partes de la
// coincidencia, corrompiendo el bundle en silencio.
const html = readFileSync(join(dist, 'index.html'), 'utf8')
  .replace(/<script[^>]*src="[^"]*"[^>]*><\/script>/g, '')
  .replace(/<link[^>]*rel="stylesheet"[^>]*>/g, '')
  .replace('</head>', () => `<style>${estilos}</style></head>`)
  .replace('</body>', () => `<script type="module">${seguro(codigo)}</script></body>`);

const salida = join(dist, 'demo.html');
writeFileSync(salida, html);
console.log(`${salida} — ${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MB`);

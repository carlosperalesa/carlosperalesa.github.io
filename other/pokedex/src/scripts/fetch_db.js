// Node 18+ required (global fetch). Usage examples:
// 1) node src/scripts/fetch_db.js               -> descarga todo
// 2) node src/scripts/fetch_db.js --from=1 --to=151 --concurrency=12

const { mkdir, writeFile, access } = require('node:fs/promises');
const { constants: FS } = require('node:fs');
const { dirname, resolve, join } = require('node:path');

// Ensure fetch exists on older Node by polyfilling with node-fetch
if (typeof fetch === 'undefined') {
  try {
    global.fetch = require('node-fetch');
    console.log('[info] node-fetch polyfilled for this Node version');
  } catch (e) {
    console.error('[error] fetch is not available and node-fetch is not installed. Install with: npm i node-fetch@2');
    process.exit(1);
  }
}

// Write relati   ve to repository, not current cwd
// Script location: src/scripts/fetch_db.js → DB at: src/DB
const SCRIPT_DIR = __dirname;
const ROOT = resolve(SCRIPT_DIR, '..', 'DB');
const DIRS = {
  root: ROOT,
  pokemon: resolve(ROOT, 'pokemon'),
  species: resolve(ROOT, 'species'),
  cache: resolve(ROOT, 'cache'),
};

const POKEAPI = 'https://pokeapi.co/api/v2';
const ARTWORK = (id) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

function parseArgs() {
  const args = Object.fromEntries(process.argv.slice(2).map(s => {
    const [k, v] = s.replace(/^--/, '').split('=');
    return [k, v ?? 'true'];
  }));
  return {
    from: args.from ? Number(args.from) : null,
    to: args.to ? Number(args.to) : null,
    concurrency: args.concurrency ? Math.max(1, Number(args.concurrency)) : 10,
  };
}

async function ensureDir(p) {
  await mkdir(p, { recursive: true });
}

async function exists(p) {
  try {
    await access(p, FS.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function saveJson(path, data) {
  await ensureDir(dirname(path));
  await writeFile(path, JSON.stringify(data, null, 2), 'utf-8');
}

async function fetchJson(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url);
    if (res.ok) return res.json();
    const backoffMs = 500 * Math.pow(2, i);
    await new Promise(r => setTimeout(r, backoffMs));
  }
  throw new Error(`Failed to fetch ${url}`);
}

async function fetchBinary(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url);
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    const backoffMs = 500 * Math.pow(2, i);
    await new Promise(r => setTimeout(r, backoffMs));
  }
  throw new Error(`Failed to fetch ${url}`);
}

async function saveBinary(path, data) {
  await ensureDir(dirname(path));
  await writeFile(path, data);
}

async function getTotalCount() {
  const meta = await fetchJson(`${POKEAPI}/pokemon?limit=1`);
  return meta.count;
}

function createLimiter(max) {
  let active = 0;
  const queue = [];
  const next = () => {
    if (active >= max) return;
    const job = queue.shift();
    if (!job) return;
    active++;
    job().finally(() => {
      active--;
      next();
    });
  };
  return (fn) => new Promise((resolve, reject) => {
    queue.push(async () => {
      try { resolve(await fn()); } catch (e) { reject(e); }
    });
    next();
  });
}

async function main() {
  const { from, to, concurrency } = parseArgs();
  await Promise.all([ensureDir(DIRS.root), ensureDir(DIRS.pokemon), ensureDir(DIRS.species), ensureDir(DIRS.cache)]);

  const total = to ?? await getTotalCount();
  const start = from ?? 1;
  console.log(`[start] Output dir: ${DIRS.root}`);
  console.log(`[start] Fetching Pokémon ${start}..${total} with concurrency=${concurrency}`);

  const limit = createLimiter(concurrency);
  let completed = 0;

  const tasks = [];
  for (let id = start; id <= total; id++) {
    tasks.push(limit(async () => {
      const pokemonPath = resolve(DIRS.pokemon, `${id}.json`);
      const speciesPath = resolve(DIRS.species, `${id}.json`);
      const imagePath = resolve(DIRS.cache, `${id}.png`);

      try {
        if (!(await exists(pokemonPath))) {
          const pokemon = await fetchJson(`${POKEAPI}/pokemon/${id}`);
          await saveJson(pokemonPath, pokemon);
        }
        if (!(await exists(speciesPath))) {
          const species = await fetchJson(`${POKEAPI}/pokemon-species/${id}`);
          await saveJson(speciesPath, species);
        }
        if (!(await exists(imagePath))) {
          const img = await fetchBinary(ARTWORK(id));
          await saveBinary(imagePath, img);
        }
        completed++;
        if (completed % 25 === 0) console.log(`[progress] ${completed} descargados`);
      } catch (err) {
        console.error(`[error] id=${id}:`, err.message);
      }
    }));
  }

  await Promise.all(tasks);
  console.log('[done] Completado.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});



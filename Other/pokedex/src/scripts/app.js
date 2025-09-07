const pokemonContainer = document.getElementById("pokemon-container");
const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");

let offset = 0;
const limit = 20;
let isLoading = false;

const speciesCache = new Map();
const speciesFullCache = new Map();

function debounce(fn, delay = 200) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}

function showSpinner() {
    spinner.style.display = 'block';
}

function hideSpinner() {
    spinner.style.display = 'none';
}

// Crear y añadir spinner al DOM
const spinner = document.createElement('div');
spinner.className = 'spinner';
document.body.appendChild(spinner);

// Crear y añadir sentinel para IntersectionObserver
const sentinel = document.createElement('div');
pokemonContainer.after(sentinel);

// Función para obtener la lista de Pokémon con paginación
async function fetchAllPokemon(limit, offset) {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`);
    if (!response.ok) throw new Error('Error al obtener la lista de Pokémon');
    const data = await response.json();
    return data.results;
}

// Función para obtener datos de un Pokémon por su URL
async function fetchPokemonByUrl(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Error al obtener detalles de Pokémon');
    const data = await response.json();
    return data;
}

// Obtener datos de especie con caché (memoria y localStorage)
async function fetchPokemonSpecies(id) {
    if (speciesCache.has(id)) return speciesCache.get(id);

    const localKey = `species_${id}`;
    const fromLocal = localStorage.getItem(localKey);
    if (fromLocal) {
        const parsed = JSON.parse(fromLocal);
        speciesCache.set(id, parsed);
        return parsed;
    }

    const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
    if (!response.ok) throw new Error('Error al obtener especie');
    const data = await response.json();

    // Guardar solo lo necesario para no saturar storage
    const minimal = { id, names: data.names };
    speciesCache.set(id, minimal);
    try {
        localStorage.setItem(localKey, JSON.stringify(minimal));
    } catch (_) {
        // Storage lleno o no disponible; continuar sin bloquear
    }
    return minimal;
}

function buildCard(pokemon, spanishName) {
    const card = document.createElement('div');
    card.className = 'card';

    const img = document.createElement('img');
    img.src = pokemon.sprites.front_default;
    img.alt = spanishName;
    img.loading = 'lazy';

    const info = document.createElement('div');
    const title = document.createElement('h2');
    title.textContent = spanishName;
    const type = document.createElement('h1');
    type.textContent = `Tipo: ${pokemon.types.map(t => t.type.name).join(', ')}`;

    info.appendChild(title);
    info.appendChild(type);
    card.appendChild(img);
    card.appendChild(info);

    card.addEventListener('click', () => openModal(pokemon));
    return card;
}

function createModalBase() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'modal';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close';
    closeBtn.setAttribute('aria-label', 'Cerrar');
    closeBtn.textContent = '×';

    modal.appendChild(closeBtn);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    function close() {
        overlay.remove();
        document.removeEventListener('keydown', onKeyDown);
    }

    function onKeyDown(e) {
        if (e.key === 'Escape') close();
    }

    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', onKeyDown);

    return { overlay, modal, close };
}

async function fetchPokemonSpeciesFull(id) {
    if (speciesFullCache.has(id)) return speciesFullCache.get(id);

    const localKey = `species_full_${id}`;
    const fromLocal = localStorage.getItem(localKey);
    if (fromLocal) {
        const parsed = JSON.parse(fromLocal);
        speciesFullCache.set(id, parsed);
        return parsed;
    }
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
    if (!response.ok) throw new Error('Error al obtener especie (detalle)');
    const data = await response.json();
    speciesFullCache.set(id, data);
    try { localStorage.setItem(localKey, JSON.stringify(data)); } catch (_) { }
    return data;
}

function getSpanish(values, field = 'name') {
    const item = values.find(v => v.language?.name === 'es');
    return item ? item[field] || item.name : undefined;
}

function buildStatRow(label, value) {
    const row = document.createElement('div');
    row.className = 'detail-row';
    const l = document.createElement('span');
    l.className = 'detail-label';
    l.textContent = label;
    const v = document.createElement('span');
    v.className = 'detail-value';
    v.textContent = value;
    row.appendChild(l);
    row.appendChild(v);
    return row;
}

async function openModal(pokemon) {
    const { modal } = createModalBase();

    const content = document.createElement('div');
    content.className = 'modal-content';

    const left = document.createElement('div');
    left.className = 'modal-left';
    const right = document.createElement('div');
    right.className = 'modal-right';

    const artwork = pokemon.sprites.other?.["official-artwork"]?.front_default || pokemon.sprites.front_default;
    const bigImg = document.createElement('img');
    bigImg.className = 'modal-image';
    bigImg.src = artwork;
    bigImg.alt = pokemon.name;
    bigImg.width = 200;
    bigImg.height = 200;
    bigImg.loading = 'lazy';
    left.appendChild(bigImg);

    const species = await fetchPokemonSpeciesFull(pokemon.id).catch(() => undefined);
    const spanishName = species?.names ? (species.names.find(n => n.language.name === 'es')?.name || pokemon.name) : pokemon.name;
    const genus = species?.genera ? getSpanish(species.genera, 'genus') : undefined;
    const flavor = species?.flavor_text_entries ? getSpanish(species.flavor_text_entries, 'flavor_text')?.replace(/\s+/g, ' ') : undefined;

    const header = document.createElement('h2');
    header.className = 'modal-title';
    header.textContent = spanishName;

    const subtitle = document.createElement('div');
    subtitle.className = 'modal-subtitle';
    subtitle.textContent = genus ? genus : `#${pokemon.id}`;

    const infoGrid = document.createElement('div');
    infoGrid.className = 'detail-grid';

    infoGrid.appendChild(buildStatRow('ID', `#${pokemon.id}`));
    infoGrid.appendChild(buildStatRow('Tipos', pokemon.types.map(t => t.type.name).join(', ')));
    infoGrid.appendChild(buildStatRow('Altura', `${pokemon.height / 10} m`));
    infoGrid.appendChild(buildStatRow('Peso', `${pokemon.weight / 10} kg`));
    infoGrid.appendChild(buildStatRow('Experiencia base', String(pokemon.base_experience)));
    infoGrid.appendChild(buildStatRow('Habilidades', pokemon.abilities.map(a => a.ability.name).join(', ')));

    const stats = document.createElement('div');
    stats.className = 'stats';
    pokemon.stats.forEach(s => {
        stats.appendChild(buildStatRow(s.stat.name, String(s.base_stat)));
    });

    right.appendChild(header);
    right.appendChild(subtitle);
    if (flavor) {
        const p = document.createElement('p');
        p.className = 'modal-flavor';
        p.textContent = flavor;
        right.appendChild(p);
    }
    right.appendChild(infoGrid);
    right.appendChild(stats);

    content.appendChild(left);
    content.appendChild(right);
    modal.appendChild(content);
}

async function loadPokemons() {
    if (isLoading) return;
    isLoading = true;
    showSpinner();
    try {
        const allPokemon = await fetchAllPokemon(limit, offset);

        const details = await Promise.all(allPokemon.map(p => fetchPokemonByUrl(p.url)));
        const species = await Promise.all(details.map(d => fetchPokemonSpecies(d.id)));

        const fragment = document.createDocumentFragment();
        details.forEach((pokemon, i) => {
            const spanishName = species[i].names.find(n => n.language.name === 'es')?.name || pokemon.name;
            const card = buildCard(pokemon, spanishName);
            fragment.appendChild(card);
        });
        pokemonContainer.appendChild(fragment);

        offset += limit;
    } catch (error) {
        console.error(error);
        alert('Ocurrió un problema al cargar los Pokémon. Intenta nuevamente.');
    } finally {
        hideSpinner();
        isLoading = false;
    }
}

// IntersectionObserver para carga infinita
const io = new IntersectionObserver(async entries => {
    if (entries.some(e => e.isIntersecting) && !isLoading) {
        await loadPokemons();
    }
}, { rootMargin: '200px' });
io.observe(sentinel);

function filterPokemon() {
    const searchTerm = searchInput.value.toLowerCase();
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        const pokemonName = card.querySelector('h2').textContent.toLowerCase();
        card.style.display = !searchTerm || pokemonName.includes(searchTerm) ? 'flex' : 'none';
    });
}

searchInput.addEventListener('input', debounce(filterPokemon, 200));
searchButton.addEventListener('click', filterPokemon);

// Cargar los primeros Pokémon
loadPokemons();
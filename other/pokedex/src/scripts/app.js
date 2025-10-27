const pokemonContainer = document.getElementById("pokemon-container");
const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");

let offset = 0;
const limit = 100;
let isLoading = false;

const speciesCache = new Map();
const speciesFullCache = new Map();

// Favoritos
const FAVORITES_KEY = 'favorites_ids';
function loadFavorites() {
    try {
        const raw = localStorage.getItem(FAVORITES_KEY);
        return new Set(raw ? JSON.parse(raw) : []);
    } catch (_) {
        return new Set();
    }
}
function saveFavorites(set) {
    try { localStorage.setItem(FAVORITES_KEY, JSON.stringify([...set])); } catch (_) { }
}
const favoriteIds = loadFavorites();
function isFavorite(id) { return favoriteIds.has(id); }
function toggleFavorite(id) {
    if (favoriteIds.has(id)) favoriteIds.delete(id); else favoriteIds.add(id);
    saveFavorites(favoriteIds);
}

// Filtros por tipo (multi-selección)
const ALL_TYPES = [
    'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying',
    'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
];
const selectedTypes = new Set();
function renderTypeChips() {
    const filtersBar = document.querySelector('.filters-bar .type-chips');
    const chips = filtersBar;
    chips.innerHTML = '';
    ALL_TYPES.forEach(t => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'chip';
        btn.textContent = t;
        if (selectedTypes.has(t)) btn.classList.add('active');
        btn.addEventListener('click', () => {
            if (selectedTypes.has(t)) selectedTypes.delete(t); else selectedTypes.add(t);
            btn.classList.toggle('active');
            filterPokemon();
        });
        chips.appendChild(btn);
    });
}

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
sentinel.className = 'sentinel';
pokemonContainer.after(sentinel);
const loadedCounter = document.getElementById('loaded-counter');
let loadedCount = 0;
let totalCount = null;

function updateLoadedCounter() {
    if (!loadedCounter) return;
    if (totalCount != null) {
        loadedCounter.textContent = `Pokémon cargados: ${loadedCount} de ${totalCount}`;
    } else {
        loadedCounter.textContent = `Pokémon cargados: ${loadedCount}`;
    }
}

// Función para obtener la lista de Pokémon con paginación
async function fetchAllPokemon(limit, offset) {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`);
    if (!response.ok) throw new Error('Error al obtener la lista de Pokémon');
    const data = await response.json();
    if (totalCount == null && typeof data.count === 'number') {
        totalCount = data.count;
        updateLoadedCounter();
    }
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
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
        if (!response.ok) throw new Error(`Error al obtener especie ${id}`);
        const data = await response.json();
        // Guardamos solo lo necesario para no saturar el localStorage
        const minimal = {
            id,
            names: data.names,
            genera: data.genera,
            evolution_chain: data.evolution_chain,
            flavor_text_entries: data.flavor_text_entries
        };
        speciesCache.set(id, minimal);
        try {
            localStorage.setItem(localKey, JSON.stringify(minimal));
        } catch (_) { }
        return minimal;
    } catch (error) {
        console.error(error);
        // Retornamos datos por defecto para evitar romper la app
        const fallback = { id, names: [{ language: { name: 'es' }, name: `#${id}` }] };
        speciesCache.set(id, fallback);
        return fallback;
    }
}

function buildCard(pokemon, spanishName) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = String(pokemon.id);
    card.dataset.types = pokemon.types.map(t => t.type.name).join(',');

    const img = document.createElement('img');
    img.src = `src/DB/cache/${pokemon.id}.png`;
    img.onerror = () => { img.src = pokemon.sprites.front_default; };
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
    overlay.style.zIndex = '9999'; // Asegura que el modal quede sobre la barra de búsqueda
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
    // Intentar leer JSON local primero
    try {
        const localRes = await fetch(`src/DB/species/${id}.json`);
        if (localRes.ok) {
            const localData = await localRes.json();
            speciesFullCache.set(id, localData);
            return localData;
        }
    } catch (_) { }

    const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
    if (!response.ok) throw new Error('Error al obtener especie (detalle)');
    const data = await response.json();
    speciesFullCache.set(id, data);
    try { localStorage.setItem(localKey, JSON.stringify(data)); } catch (_) { }
    return data;
}

function extractIdFromSpeciesUrl(url) {
    const match = url.match(/\/pokemon-species\/(\d+)\/?$/);
    return match ? Number(match[1]) : null;
}

async function fetchEvolutionChain(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Error al obtener cadena de evolución');
    const data = await response.json();
    return data;
}

function flattenEvolutionChain(chain) {
    // Devuelve lista en orden: especie base -> evoluciones -> ...
    const result = [];
    function traverse(node) {
        const id = extractIdFromSpeciesUrl(node.species.url);
        result.push({ id, name: node.species.name });
        if (node.evolves_to && node.evolves_to.length) {
            node.evolves_to.forEach(traverse);
        }
    }
    traverse(chain);
    return result;
}

function buildEvolutionItem(e) {
    const li = document.createElement('button');
    li.className = 'evo-item';
    li.setAttribute('type', 'button');
    li.setAttribute('aria-label', `Abrir ${e.name}`);
    const img = document.createElement('img');
    img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${e.id}.png`;
    img.alt = e.name;
    img.loading = 'lazy';
    img.width = 96;
    img.height = 96;
    const label = document.createElement('span');
    label.textContent = e.name;
    li.appendChild(img);
    li.appendChild(label);
    li.addEventListener('click', async () => {
        try {
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${e.id}`);
            if (!response.ok) throw new Error('No se pudo cargar el Pokémon');
            const data = await response.json();
            openModal(data);
        } catch (err) {
            console.error(err);
        }
    });
    return li;
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
    bigImg.src = `src/DB/cache/${pokemon.id}.png`;
    bigImg.onerror = () => { bigImg.src = artwork; };
    bigImg.alt = pokemon.name;
    bigImg.width = 200;
    bigImg.height = 200;
    bigImg.loading = 'lazy';
    left.appendChild(bigImg);

    const species = await fetchPokemonSpeciesFull(pokemon.id).catch(() => undefined);
    const spanishName = species?.names ? (species.names.find(n => n.language.name === 'es')?.name || pokemon.name) : pokemon.name;
    const genus = species?.genera ? getSpanish(species.genera, 'genus') : undefined;
    const flavor = species?.flavor_text_entries ? getSpanish(species.flavor_text_entries, 'flavor_text')?.replace(/\s+/g, ' ') : undefined;

    const headerWrap = document.createElement('div');
    headerWrap.className = 'modal-header';
    const header = document.createElement('h2');
    header.className = 'modal-title';
    header.textContent = spanishName;
    const favBtn = document.createElement('button');
    favBtn.className = 'fav-btn-modal';
    favBtn.type = 'button';
    const setFavIconModal = () => {
        favBtn.textContent = isFavorite(pokemon.id) ? '★' : '☆';
        favBtn.classList.toggle('active', isFavorite(pokemon.id));
    };
    setFavIconModal();
    favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(pokemon.id);
        setFavIconModal();
        // Actualizar insignia en tarjeta pequeña y fijarla al inicio si es favorito
        const smallCard = document.querySelector(`.card[data-id="${pokemon.id}"]`);
        if (smallCard) {
            const b = smallCard.querySelector('.fav-badge');
            if (b) b.style.display = isFavorite(pokemon.id) ? 'block' : 'none';
            if (isFavorite(pokemon.id)) pokemonContainer.prepend(smallCard);
        }
    });
    headerWrap.appendChild(header);
    headerWrap.appendChild(favBtn);

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

    right.appendChild(headerWrap);
    right.appendChild(subtitle);
    if (flavor) {
        const p = document.createElement('p');
        p.className = 'modal-flavor';
        p.textContent = flavor;
        right.appendChild(p);
    }
    right.appendChild(infoGrid);
    right.appendChild(stats);

    // Cadena de evoluciones
    if (species?.evolution_chain?.url) {
        try {
            const evoData = await fetchEvolutionChain(species.evolution_chain.url);
            const list = flattenEvolutionChain(evoData.chain);
            if (list.length > 0) {
                const evoSection = document.createElement('div');
                evoSection.className = 'evo-section';
                const evoTitle = document.createElement('h3');
                evoTitle.textContent = 'Evoluciones';
                const evoList = document.createElement('div');
                evoList.className = 'evo-list';

                list.forEach((e, idx) => {
                    if (idx > 0) {
                        const arrow = document.createElement('span');
                        arrow.className = 'evo-arrow';
                        arrow.textContent = '›';
                        evoList.appendChild(arrow);
                    }
                    evoList.appendChild(buildEvolutionItem(e));
                });

                evoSection.appendChild(evoTitle);
                evoSection.appendChild(evoList);
                right.appendChild(evoSection);
            }
        } catch (err) {
            console.error('Evolución:', err);
        }
    }

    // Sección de audio (cries)
    if (pokemon.cries && (pokemon.cries.latest || pokemon.cries.legacy)) {
        const audioSection = document.createElement('div');
        audioSection.className = 'audio-section';

        const audioTitle = document.createElement('h3');
        audioTitle.textContent = 'Gritos (audio)';
        audioSection.appendChild(audioTitle);

        if (pokemon.cries.latest) {
            const latestWrap = document.createElement('div');
            latestWrap.className = 'audio-row';
            const latestLabel = document.createElement('span');
            latestLabel.className = 'audio-label';
            latestLabel.textContent = 'Latest:';
            const latestAudio = document.createElement('audio');
            latestAudio.controls = true;
            latestAudio.preload = 'none';
            latestAudio.src = pokemon.cries.latest;
            latestWrap.appendChild(latestLabel);
            latestWrap.appendChild(latestAudio);
            audioSection.appendChild(latestWrap);
        }

        if (pokemon.cries.legacy) {
            const legacyWrap = document.createElement('div');
            legacyWrap.className = 'audio-row';
            const legacyLabel = document.createElement('span');
            legacyLabel.className = 'audio-label';
            legacyLabel.textContent = 'Legacy:';
            const legacyAudio = document.createElement('audio');
            legacyAudio.controls = true;
            legacyAudio.preload = 'none';
            legacyAudio.src = pokemon.cries.legacy;
            legacyWrap.appendChild(legacyLabel);
            legacyWrap.appendChild(legacyAudio);
            audioSection.appendChild(legacyWrap);
        }

        right.appendChild(audioSection);
    }

    content.appendChild(left);
    content.appendChild(right);
    modal.appendChild(content);
}

// Skeletons
function addSkeletons(count) {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
        const card = document.createElement('div');
        card.className = 'card skeleton';
        const img = document.createElement('div');
        img.className = 'skeleton-img';
        const info = document.createElement('div');
        info.className = 'skeleton-info';
        const line1 = document.createElement('div');
        line1.className = 'skeleton-line';
        const line2 = document.createElement('div');
        line2.className = 'skeleton-line short';
        info.appendChild(line1);
        info.appendChild(line2);
        card.appendChild(img);
        card.appendChild(info);
        fragment.appendChild(card);
    }
    pokemonContainer.appendChild(fragment);
}

function clearSkeletons() {
    document.querySelectorAll('.card.skeleton').forEach(n => n.remove());
}

async function loadPokemons() {
    if (isLoading) return;
    isLoading = true;
    showSpinner();
    addSkeletons(limit);
    try {
        const allPokemon = await fetchAllPokemon(limit, offset);

        const details = await Promise.all(allPokemon.map(p => fetchPokemonByUrl(p.url)));
        const species = await Promise.all(details.map(d => fetchPokemonSpecies(d.id)));

        const favFrag = document.createDocumentFragment();
        const otherFrag = document.createDocumentFragment();
        details.forEach((pokemon, i) => {
            const spanishName = species[i].names.find(n => n.language.name === 'es')?.name || pokemon.name;
            const card = buildCard(pokemon, spanishName);
            (isFavorite(pokemon.id) ? favFrag : otherFrag).appendChild(card);
        });
        pokemonContainer.appendChild(favFrag);
        pokemonContainer.appendChild(otherFrag);

        offset += limit;
        loadedCount += details.length;
        updateLoadedCounter();
    } catch (error) {
        console.error(error);
        alert('Ocurrió un problema al cargar los Pokémon. Intenta nuevamente.');
    } finally {
        clearSkeletons();
        hideSpinner();
        isLoading = false;
    }
}

// IntersectionObserver para carga infinita
const io = new IntersectionObserver(async entries => {
    if (entries.some(e => e.isIntersecting) && !isLoading) {
        await loadPokemons();
    }
}, { rootMargin: '600px' });
io.observe(sentinel);

// Fallback por si el observer no dispara en algunos navegadores/overlays
window.addEventListener('scroll', () => {
    const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 800;
    if (nearBottom && !isLoading) {
        loadPokemons();
    }
});

function filterPokemon() {
    const searchTerm = searchInput.value.toLowerCase();
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        if (card.classList.contains('skeleton')) return; // no aplicar a skeletons
        const pokemonName = card.querySelector('h2').textContent.toLowerCase();
        const types = (card.dataset.types || '').split(',').filter(Boolean);
        const nameMatches = !searchTerm || pokemonName.includes(searchTerm);
        const typesMatch = selectedTypes.size === 0 || [...selectedTypes].every(t => types.includes(t));
        card.style.display = (nameMatches && typesMatch) ? 'flex' : 'none';
    });
}

searchInput.addEventListener('input', debounce(filterPokemon, 200));
searchButton.addEventListener('click', filterPokemon);

// Cargar los primeros Pokémon
renderTypeChips();
loadPokemons();
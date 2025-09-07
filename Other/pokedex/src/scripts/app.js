const pokemonContainer = document.getElementById("pokemon-container");
const searchInput = document.getElementById("search-input"); // Obtener el campo de búsqueda
const searchButton = document.getElementById("search-button"); // Obtener el botón de búsqueda

let offset = 0; // Controla desde qué Pokémon empezar a cargar
const limit = 20; // Cuántos Pokémon cargar por solicitud
let isLoading = false; // Evita múltiples solicitudes simultáneas

// Función para obtener la lista de Pokémon con paginación
async function fetchAllPokemon(limit, offset) {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`);
    const data = await response.json();
    return data.results; // Devuelve una lista con los nombres y URLs de los Pokémon
}

// Función para obtener datos de un Pokémon por su URL
async function fetchPokemonByUrl(url) {
    const response = await fetch(url);
    const data = await response.json();
    return data;
}

// Función para obtener datos adicionales de la especie del Pokémon
async function fetchPokemonSpecies(id) {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
    const data = await response.json();
    return data;
}

// Función para crear una tarjeta de Pokémon
async function createPokemonCard(pokemon) {
    const card = document.createElement("div");
    card.classList.add("card");

    const pokemonType = pokemon.types.map(typeInfo => typeInfo.type.name).join(", ");
    const speciesData = await fetchPokemonSpecies(pokemon.id);

    // Obtener el nombre en español
    const spanishName = speciesData.names.find(name => name.language.name === "es")?.name || pokemon.name;

    card.innerHTML = `
        <img src="${pokemon.sprites.front_default}" alt="${spanishName}">
        <div>
            <h2>${spanishName}</h2>
            <h1>Tipo: ${pokemonType}</h1>
        </div>
    `;

    pokemonContainer.appendChild(card);
}

// Función para cargar los Pokémon con paginación
async function loadPokemons() {
    if (isLoading) return; // Evita múltiples solicitudes simultáneas
    isLoading = true;

    const allPokemon = await fetchAllPokemon(limit, offset);
    for (const pokemonInfo of allPokemon) {
        const pokemon = await fetchPokemonByUrl(pokemonInfo.url);
        await createPokemonCard(pokemon);
    }

    offset += limit; // Incrementa el offset para la siguiente carga
    isLoading = false;
}

// Detectar el final del scroll para cargar más Pokémon
window.addEventListener("scroll", () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100 && !isLoading) {
        loadPokemons();
    }
});

// Función para filtrar las tarjetas de Pokémon
function filterPokemon() {
    const searchTerm = searchInput.value.toLowerCase();
    const cards = document.querySelectorAll(".card");

    cards.forEach(card => {
        const pokemonName = card.querySelector("h2").textContent.toLowerCase();
        if (searchTerm === "" || pokemonName.includes(searchTerm)) {
            card.style.display = "flex"; // Mostrar la tarjeta si coincide o si el campo está vacío
        } else {
            card.style.display = "none"; // Ocultar la tarjeta si no coincide
        }
    });
}

// Evento para buscar mientras se escribe
searchInput.addEventListener("input", filterPokemon);

// Evento para buscar al hacer clic en el botón
searchButton.addEventListener("click", filterPokemon);

// Cargar los primeros Pokémon al cargar la página
loadPokemons();
const pokemonContainer = document.getElementById("pokemon-container");

// Función para obtener datos de un Pokémon por su ID
async function fetchPokemon(id) {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const data = await response.json();
    return data;
}

// Función para crear una tarjeta de Pokémon
async function createPokemonCard(pokemon) {
    const card = document.createElement("div");
    card.classList.add("card");

    const pokemonType = pokemon.types.map(typeInfo => typeInfo.type.name).join(", ");

    card.innerHTML = `
        <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
        <div>
            <h1>${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}</h1>
            <h2>Tipo: ${pokemonType}</h2>
        </div>
    `;

    pokemonContainer.appendChild(card);
}

// Función principal para cargar los Pokémon
async function loadPokemons() {
    for (let i = 1; i <= 20; i++) { // Cambia el número para obtener más Pokémon
        const pokemon = await fetchPokemon(i);
        createPokemonCard(pokemon);
    }
}

// Cargar los Pokémon al cargar la página
loadPokemons();
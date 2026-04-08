import axios from 'axios';

const BASE_URL = 'https://pokeapi.co/api/v2';

export const fetchPokemonList = async (limit = 151, offset = 0) => {
    const response = await axios.get(`${BASE_URL}/pokemon?limit=${limit}&offset=${offset}`);
    return response.data.results;
};

export const fetchPokemonDetails = async (nameOrId: string | number) => {
    const response = await axios.get(`${BASE_URL}/pokemon/${nameOrId}`);
    return response.data;
};

export const fetchRegions = async () => {
    // Hardcoding generations for simplicity, or we can fetch generation endpoints
    return [
        { name: 'Kanto', offset: 0, limit: 151 },
        { name: 'Johto', offset: 151, limit: 100 },
        { name: 'Hoenn', offset: 251, limit: 135 },
        { name: 'Sinnoh', offset: 386, limit: 107 },
        { name: 'Unova', offset: 493, limit: 156 },
        { name: 'Kalos', offset: 649, limit: 72 },
        { name: 'Alola', offset: 721, limit: 88 },
        { name: 'Galar', offset: 809, limit: 89 },
        { name: 'Paldea', offset: 905, limit: 120 }
    ];
};

import { Pokemon, PokemonSummary } from '../../domain/pokemon';
import { PokeApiNamedResource, PokeApiPokemonResponse } from './pokeapi.types';

const OFFICIAL_ARTWORK_URL =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork';

export function toPokemonSummary(
  resource: PokeApiNamedResource,
): PokemonSummary {
  const id = extractIdFromUrl(resource.url);
  return {
    id,
    name: resource.name,
    image: `${OFFICIAL_ARTWORK_URL}/${id}.png`,
  };
}

export function toPokemon(raw: PokeApiPokemonResponse): Pokemon {
  return {
    id: raw.id,
    name: raw.name,
    image: raw.sprites.other['official-artwork'].front_default,
    types: raw.types.map((entry) => entry.type.name),
    heightM: raw.height / 10,
    weightKg: raw.weight / 10,
    abilities: raw.abilities.map((entry) => entry.ability.name),
    stats: raw.stats.map((entry) => ({
      name: entry.stat.name,
      value: entry.base_stat,
    })),
  };
}

// La lista de PokéAPI no trae el id: viene al final de la URL ("/pokemon/25/").
function extractIdFromUrl(url: string): number {
  const segments = url.split('/').filter(Boolean);
  return Number(segments[segments.length - 1]);
}

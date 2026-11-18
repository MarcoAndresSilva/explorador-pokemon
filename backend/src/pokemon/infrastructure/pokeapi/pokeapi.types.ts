export interface PokeApiNamedResource {
  name: string;
  url: string;
}

export interface PokeApiListResponse {
  count: number;
  results: PokeApiNamedResource[];
}

export interface PokeApiPokemonResponse {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: { slot: number; type: PokeApiNamedResource }[];
  abilities: { ability: PokeApiNamedResource }[];
  stats: { base_stat: number; stat: PokeApiNamedResource }[];
  sprites: {
    other: {
      'official-artwork': { front_default: string | null };
    };
  };
}

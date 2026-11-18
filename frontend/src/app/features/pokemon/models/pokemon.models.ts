// Copia del contrato del BFF (ARCHITECTURE.md, D7).

export interface PokemonSummary {
  id: number;
  name: string;
  image: string;
}

export interface PokemonPage {
  items: PokemonSummary[];
  total: number;
  limit: number;
  offset: number;
}

export interface PokemonStat {
  name: string;
  value: number;
}

export interface Pokemon {
  id: number;
  name: string;
  image: string | null;
  types: string[];
  heightM: number;
  weightKg: number;
  abilities: string[];
  stats: PokemonStat[];
}

export interface PokemonListQuery {
  search: string;
  limit: number;
  offset: number;
}

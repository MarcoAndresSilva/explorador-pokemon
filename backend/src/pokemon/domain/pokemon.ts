export interface PokemonSummary {
  id: number;
  name: string;
  image: string;
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

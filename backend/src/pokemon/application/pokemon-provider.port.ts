import { Pokemon, PokemonSummary } from '../domain/pokemon';

export abstract class PokemonProvider {
  abstract listAll(): Promise<PokemonSummary[]>;
  abstract getByName(name: string): Promise<Pokemon>;
}

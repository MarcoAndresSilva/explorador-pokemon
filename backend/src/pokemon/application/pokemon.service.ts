import { Injectable } from '@nestjs/common';
import { Pokemon, PokemonSummary } from '../domain/pokemon';
import { PokemonProvider } from './pokemon-provider.port';

export interface ListPokemonQuery {
  search?: string;
  limit: number;
  offset: number;
}

export interface PokemonPage {
  items: PokemonSummary[];
  total: number;
  limit: number;
  offset: number;
}

@Injectable()
export class PokemonService {
  constructor(private readonly provider: PokemonProvider) {}

  async list(query: ListPokemonQuery): Promise<PokemonPage> {
    const { search, limit, offset } = query;
    const allPokemon = await this.provider.listAll();
    const matches = this.filterByName(allPokemon, search);

    return {
      items: matches.slice(offset, offset + limit),
      total: matches.length,
      limit,
      offset,
    };
  }

  getByName(name: string): Promise<Pokemon> {
    return this.provider.getByName(this.normalize(name));
  }

  private filterByName(
    pokemon: PokemonSummary[],
    search?: string,
  ): PokemonSummary[] {
    const term = this.normalize(search ?? '');
    if (!term) {
      return pokemon;
    }
    return pokemon.filter((p) => p.name.includes(term));
  }

  private normalize(text: string): string {
    return text.trim().toLowerCase();
  }
}

import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { PokemonProvider } from '../../application/pokemon-provider.port';
import { Pokemon, PokemonSummary } from '../../domain/pokemon';
import {
  ExternalServiceError,
  PokemonNotFoundError,
} from '../../domain/pokemon.errors';
import { toPokemon, toPokemonSummary } from './pokeapi.mapper';
import { PokeApiListResponse, PokeApiPokemonResponse } from './pokeapi.types';

const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2';
const ALL_POKEMON_LIMIT = 2000;

@Injectable()
export class PokeApiAdapter extends PokemonProvider {
  constructor(private readonly http: HttpService) {
    super();
  }

  async listAll(): Promise<PokemonSummary[]> {
    const body = await this.fetchFromPokeApi<PokeApiListResponse>(
      `/pokemon?limit=${ALL_POKEMON_LIMIT}`,
    );
    return body.results.map(toPokemonSummary);
  }

  async getByName(name: string): Promise<Pokemon> {
    const body = await this.fetchFromPokeApi<PokeApiPokemonResponse>(
      `/pokemon/${encodeURIComponent(name)}`,
      name,
    );
    return toPokemon(body);
  }

  private async fetchFromPokeApi<T>(
    path: string,
    pokemonName?: string,
  ): Promise<T> {
    try {
      const response = await firstValueFrom(
        this.http.get<T>(`${POKEAPI_BASE_URL}${path}`),
      );
      return response.data;
    } catch (error) {
      if (pokemonName && isNotFound(error)) {
        throw new PokemonNotFoundError(pokemonName);
      }
      throw new ExternalServiceError();
    }
  }
}

function isNotFound(error: unknown): boolean {
  return error instanceof AxiosError && error.response?.status === 404;
}

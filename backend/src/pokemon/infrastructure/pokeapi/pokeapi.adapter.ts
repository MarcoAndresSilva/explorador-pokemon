import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { AppConfig } from '../../../config/app.config';
import { PokemonProvider } from '../../application/pokemon-provider.port';
import { Pokemon, PokemonSummary } from '../../domain/pokemon';
import {
  ExternalServiceError,
  PokemonNotFoundError,
} from '../../domain/pokemon.errors';
import { toPokemon, toPokemonSummary } from './pokeapi.mapper';
import { PokeApiListResponse, PokeApiPokemonResponse } from './pokeapi.types';
import { TtlCache } from './ttl-cache';

const ALL_POKEMON_LIMIT = 2000;
const LIST_CACHE_KEY = 'all';

@Injectable()
export class PokeApiAdapter extends PokemonProvider {
  private readonly listCache: TtlCache<PokemonSummary[]>;
  private readonly detailCache: TtlCache<Pokemon>;

  constructor(
    private readonly http: HttpService,
    config: ConfigService<AppConfig, true>,
  ) {
    super();
    const { cacheTtlMs } = config.get('pokeApi', { infer: true });
    this.listCache = new TtlCache(cacheTtlMs);
    this.detailCache = new TtlCache(cacheTtlMs);
  }

  async listAll(): Promise<PokemonSummary[]> {
    const cached = this.listCache.get(LIST_CACHE_KEY);
    if (cached) {
      return cached;
    }

    const body = await this.fetchFromPokeApi<PokeApiListResponse>(
      `/pokemon?limit=${ALL_POKEMON_LIMIT}`,
    );
    const summaries = body.results.map(toPokemonSummary);
    this.listCache.set(LIST_CACHE_KEY, summaries);
    return summaries;
  }

  async getByName(name: string): Promise<Pokemon> {
    const cached = this.detailCache.get(name);
    if (cached) {
      return cached;
    }

    const body = await this.fetchFromPokeApi<PokeApiPokemonResponse>(
      `/pokemon/${encodeURIComponent(name)}`,
      name,
    );
    const pokemon = toPokemon(body);
    this.detailCache.set(name, pokemon);
    return pokemon;
  }

  private async fetchFromPokeApi<T>(
    path: string,
    pokemonName?: string,
  ): Promise<T> {
    try {
      const response = await firstValueFrom(this.http.get<T>(path));
      return response.data;
    } catch (error) {
      if (pokemonName && isNotFound(error)) {
        throw new PokemonNotFoundError(pokemonName);
      }
      throw new ExternalServiceError(describeFailure(error));
    }
  }
}

function isNotFound(error: unknown): boolean {
  return error instanceof AxiosError && error.response?.status === 404;
}

// Solo para el log del servidor: el cliente siempre recibe un mensaje genérico.
function describeFailure(error: unknown): string {
  if (error instanceof AxiosError) {
    const reason = error.response?.status ?? error.code ?? 'unknown';
    return `PokéAPI request failed (${reason})`;
  }
  return 'PokéAPI request failed';
}

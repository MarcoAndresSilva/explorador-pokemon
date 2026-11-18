import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Pokemon, PokemonListQuery, PokemonPage } from '../models/pokemon.models';

export type ApiErrorKind = 'not-found' | 'unavailable';

@Injectable({ providedIn: 'root' })
export class PokemonApi {
  private readonly http = inject(HttpClient);

  list({ search, limit, offset }: PokemonListQuery): Observable<PokemonPage> {
    let params = new HttpParams().set('limit', limit).set('offset', offset);
    if (search.trim()) {
      params = params.set('search', search.trim());
    }
    return this.http.get<PokemonPage>('/api/pokemon', { params });
  }

  getByName(name: string): Observable<Pokemon> {
    return this.http.get<Pokemon>(`/api/pokemon/${encodeURIComponent(name)}`);
  }
}

// Un 404 o un 400 del detalle significan lo mismo para la persona: ese Pokémon no está.
export function toApiErrorKind(error: unknown): ApiErrorKind {
  const status = error instanceof HttpErrorResponse ? error.status : 0;
  return status === 404 || status === 400 ? 'not-found' : 'unavailable';
}

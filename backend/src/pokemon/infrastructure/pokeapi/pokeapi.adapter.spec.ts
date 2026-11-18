import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { AxiosError, AxiosResponse } from 'axios';
import { of, throwError } from 'rxjs';
import {
  ExternalServiceError,
  PokemonNotFoundError,
} from '../../domain/pokemon.errors';
import { PokeApiAdapter } from './pokeapi.adapter';

const LIST = {
  results: [{ name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon/25/' }],
};

const failWith = (status?: number) =>
  throwError(
    () =>
      new AxiosError('failed', undefined, undefined, undefined, {
        status,
      } as AxiosResponse),
  );

describe('PokeApiAdapter', () => {
  let adapter: PokeApiAdapter;
  const http = { get: jest.fn() };
  const config = { get: () => ({ cacheTtlMs: 60_000 }) };

  beforeEach(async () => {
    http.get.mockReset();

    const moduleRef = await Test.createTestingModule({
      providers: [
        PokeApiAdapter,
        { provide: HttpService, useValue: http },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    adapter = moduleRef.get(PokeApiAdapter);
  });

  it('calls PokéAPI only once thanks to the cache', async () => {
    http.get.mockReturnValue(of({ data: LIST }));

    await adapter.listAll();
    const list = await adapter.listAll();

    expect(list[0]).toMatchObject({ id: 25, name: 'pikachu' });
    expect(http.get).toHaveBeenCalledTimes(1);
  });

  it('turns a 404 into PokemonNotFoundError', async () => {
    http.get.mockReturnValue(failWith(404));

    await expect(adapter.getByName('x')).rejects.toThrow(PokemonNotFoundError);
  });

  it('turns any other failure into ExternalServiceError', async () => {
    http.get.mockReturnValue(failWith(500));

    await expect(adapter.getByName('x')).rejects.toThrow(ExternalServiceError);
  });
});

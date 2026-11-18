import { toPokemon, toPokemonSummary } from './pokeapi.mapper';
import { PokeApiPokemonResponse } from './pokeapi.types';

describe('pokeapi.mapper', () => {
  it('takes the id from the URL and builds the image', () => {
    const summary = toPokemonSummary({
      name: 'pikachu',
      url: 'https://pokeapi.co/api/v2/pokemon/25/',
    });

    expect(summary.id).toBe(25);
    expect(summary.image).toMatch(/\/25\.png$/);
  });

  it('converts units and flattens the PokéAPI detail', () => {
    const raw: PokeApiPokemonResponse = {
      id: 25,
      name: 'pikachu',
      height: 4,
      weight: 60,
      types: [{ slot: 1, type: { name: 'electric', url: '' } }],
      abilities: [{ ability: { name: 'static', url: '' } }],
      stats: [{ base_stat: 35, stat: { name: 'hp', url: '' } }],
      sprites: { other: { 'official-artwork': { front_default: null } } },
    };

    expect(toPokemon(raw)).toEqual({
      id: 25,
      name: 'pikachu',
      image: null,
      types: ['electric'],
      heightM: 0.4,
      weightKg: 6,
      abilities: ['static'],
      stats: [{ name: 'hp', value: 35 }],
    });
  });
});

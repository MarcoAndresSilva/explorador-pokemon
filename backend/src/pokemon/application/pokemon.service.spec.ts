import { Test } from '@nestjs/testing';
import { PokemonNotFoundError } from '../domain/pokemon.errors';
import { PokemonProvider } from './pokemon-provider.port';
import { PokemonService } from './pokemon.service';

const ALL_POKEMON = [
  { id: 1, name: 'bulbasaur', image: '1.png' },
  { id: 25, name: 'pikachu', image: '25.png' },
  { id: 26, name: 'raichu', image: '26.png' },
];

describe('PokemonService', () => {
  let service: PokemonService;
  const provider = { listAll: jest.fn(), getByName: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    provider.listAll.mockResolvedValue(ALL_POKEMON);

    const moduleRef = await Test.createTestingModule({
      providers: [
        PokemonService,
        { provide: PokemonProvider, useValue: provider },
      ],
    }).compile();

    service = moduleRef.get(PokemonService);
  });

  it('returns the requested page and the total count', async () => {
    const page = await service.list({ limit: 1, offset: 1 });

    expect(page.items.map((p) => p.name)).toEqual(['pikachu']);
    expect(page.total).toBe(3);
  });

  it('filters by partial name, ignoring case and spaces', async () => {
    const page = await service.list({ search: ' CHU ', limit: 20, offset: 0 });

    expect(page.items.map((p) => p.name)).toEqual(['pikachu', 'raichu']);
  });

  it('normalizes the name before asking the provider', async () => {
    await service.getByName(' Pikachu ');

    expect(provider.getByName).toHaveBeenCalledWith('pikachu');
  });

  it('lets PokemonNotFoundError propagate', async () => {
    provider.getByName.mockRejectedValue(new PokemonNotFoundError('x'));

    await expect(service.getByName('x')).rejects.toThrow(PokemonNotFoundError);
  });
});

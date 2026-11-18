export class PokemonNotFoundError extends Error {
  constructor(name: string) {
    super(`Pokémon "${name}" not found`);
    this.name = 'PokemonNotFoundError';
  }
}

export class ExternalServiceError extends Error {
  constructor(message = 'Pokémon data source is unavailable') {
    super(message);
    this.name = 'ExternalServiceError';
  }
}

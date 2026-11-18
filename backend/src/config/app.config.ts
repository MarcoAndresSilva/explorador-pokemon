export interface AppConfig {
  port: number;
  corsOrigin: string;
  pokeApi: {
    baseUrl: string;
    timeoutMs: number;
    cacheTtlMs: number;
  };
}

// Si una variable falta o no es un número válido, se usa el valor por defecto.
export function loadAppConfig(): AppConfig {
  return {
    port: Number(process.env.PORT) || 3000,
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    pokeApi: {
      baseUrl: process.env.POKEAPI_BASE_URL || 'https://pokeapi.co/api/v2',
      timeoutMs: Number(process.env.POKEAPI_TIMEOUT_MS) || 5000,
      cacheTtlMs: Number(process.env.CACHE_TTL_MS) || 3_600_000,
    },
  };
}

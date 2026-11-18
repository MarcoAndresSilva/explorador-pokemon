# Explorador de Pokémon

Aplicación web para explorar el catálogo de Pokémon, buscarlos por nombre y ver la ficha de cada
uno. El frontend (Angular 21) nunca llama a PokéAPI directamente: todo pasa por un BFF en NestJS
que busca, pagina, traduce y cachea los datos.

```
Navegador ──► Angular (4200) ──► BFF NestJS (3000) ──► PokéAPI
                 /api/*  ── proxy de desarrollo ──►
```

> **¿Solo quieres correrlo?** Ve directo a [Instalación y ejecución](#instalación-y-ejecución):
> son 4 pasos y no requiere configuración.

## Qué se puede hacer

- **Explorar** el catálogo completo (1.351 Pokémon) en una grilla, cargando 24 más con cada clic.
- **Buscar** por parte del nombre (`chu` encuentra Pikachu, Raichu, Pichu…), sin distinguir
  mayúsculas.
- **Ver la ficha** de un Pokémon: imagen, tipos, altura, peso, habilidades y estadísticas base.
- Mensajes claros cuando algo está cargando, no hay resultados, el Pokémon no existe o el servicio
  no responde (con botón para reintentar).

## Arquitectura

Todas las decisiones técnicas, con las alternativas descartadas y el costo aceptado en cada una,
están en **[ARCHITECTURE.md](ARCHITECTURE.md)**. Es el mejor punto de partida para entender el
código.

En resumen, el BFF usa una **arquitectura hexagonal liviana**: un solo puerto hacia PokéAPI,
que es la única dependencia externa.

```
backend/src/pokemon/
├── domain/            Tipos y errores propios. No depende de Nest ni de PokéAPI.
├── application/       PokemonProvider (puerto) y PokemonService (búsqueda y paginación).
└── infrastructure/
    ├── pokeapi/       PokeApiAdapter (implementa el puerto), mapper y caché.
    └── http/          Controller, validación de parámetros y traducción de errores a HTTP.

frontend/src/app/
├── features/pokemon/
│   ├── data-access/   PokemonApi: único servicio que llama al BFF.
│   ├── models/        Tipos del contrato con el BFF.
│   ├── components/    Tarjeta de Pokémon.
│   └── pages/         Catálogo y detalle (carga diferida).
└── shared/            Pipe para mostrar nombres.
```

El servicio solo conoce el contrato `PokemonProvider`, no a PokéAPI. Por eso se testea sin red, y
un cambio en el formato de PokéAPI se corrige en el mapper sin tocar el resto.

## Fuera de alcance y limitaciones

| Qué | Por qué |
| --- | --- |
| Autenticación, base de datos, favoritos | No hay datos de usuario; los datos de PokéAPI casi no cambian. |
| Evoluciones, descripciones, movimientos | Requieren otros endpoints de PokéAPI: más llamadas y más casos de error. |
| Habilidades en español | PokéAPI entrega el nombre traducido en un endpoint aparte por habilidad. Se priorizó un detalle con una sola llamada; los tipos y las estadísticas sí están en español. |
| SSR e internacionalización | Herramienta de exploración en un solo idioma, sin necesidad de SEO. |
| Tests e2e | El tiempo se invirtió en tests unitarios del BFF, donde está la lógica. |
| Caché compartida (Redis) | La caché vive en la memoria del BFF: se pierde al reiniciar y no se comparte entre instancias. Suficiente para un solo servidor. |
| Despliegue en dominios separados | El front llama a `/api` y el proxy de desarrollo lo reenvía al BFF, así que no hace falta CORS. Publicarlos por separado requeriría configurar la URL del BFF en el front y habilitar CORS en el BFF. |

## Librerías y herramientas

| Dónde | Qué | Para qué |
| --- | --- | --- |
| BFF | NestJS 11 | Framework del BFF (se eligió 11 y no 12; ver D3 en ARCHITECTURE.md) |
| BFF | `@nestjs/axios` + axios | Cliente HTTP hacia PokéAPI, con timeout |
| BFF | `@nestjs/config` | Configuración por variables de entorno |
| BFF | class-validator + class-transformer | Validación de parámetros de entrada |
| BFF | Jest | Tests unitarios |
| Front | Angular 21 | Componentes standalone, signals, sin zone.js |
| Front | Angular Material 21 | Componentes de interfaz (Material 3) |
| Front | RxJS | Búsqueda con espera (`debounceTime`) y cancelación (`switchMap`) |
| Front | Vitest | Tests (runner por defecto de Angular 21) |
| Ambos | TypeScript, ESLint, Prettier | Tipado estricto, lint y formato |

## Requisitos

| Herramienta | Versión | Cómo comprobarla |
| --- | --- | --- |
| Node.js | 20.19 o superior, 22.12 o superior, o 24 | `node -v` |
| npm | 10 o superior (viene con Node) | `npm -v` |
| Git | cualquiera reciente | `git --version` |

Además se necesita **conexión a internet**: los datos vienen de [PokéAPI](https://pokeapi.co) y
las fuentes de Google Fonts. Deben estar libres los puertos **3000** (BFF) y **4200** (frontend).

No hace falta instalar Angular CLI ni Nest CLI de forma global: cada proyecto usa su propia versión.

## Instalación y ejecución

Se necesitan **dos terminales**: una para el BFF y otra para el frontend.

### 1. Clonar el repositorio

```bash
git clone https://github.com/MarcoAndresSilva/explorador-pokemon.git
cd explorador-pokemon
```

### 2. Levantar el BFF (terminal 1)

```bash
cd backend
npm ci
npm run start:dev
```

Esperar el mensaje `Nest application successfully started`. El BFF queda en
`http://localhost:3000/api/pokemon`.

### 3. Levantar el frontend (terminal 2)

Desde la raíz del repositorio:

```bash
cd frontend
npm ci
npm start
```

Esperar `Local: http://localhost:4200/`.

### 4. Abrir la aplicación

Entrar a **http://localhost:4200** en el navegador.

> `npm ci` instala exactamente las versiones del `package-lock.json`, por eso se usa en lugar de
> `npm install`. No se necesita ningún archivo `.env`: todo tiene valores por defecto.

### Comprobar que el BFF responde (opcional)

```bash
curl "http://localhost:3000/api/pokemon?search=pika&limit=2"
curl "http://localhost:3000/api/pokemon/pikachu"
```

### Problemas frecuentes

| Síntoma | Causa y solución |
| --- | --- |
| `EADDRINUSE: address already in use :::3000` | Otro proceso usa el puerto 3000. Cerrarlo, o cambiar el puerto (ver [Configuración](#configuración)). |
| `Port 4200 is already in use` | `npm start -- --port 4300` y abrir `http://localhost:4300`. |
| La app muestra "El servicio no está disponible" | El BFF no está corriendo, todavía está arrancando o no hay internet. Revisar la terminal 1 y pulsar **Reintentar**. |
| `npm ci` falla por la versión de Node | Actualizar Node a una de las versiones de la tabla de requisitos. |

## Configuración

El BFF funciona sin configuración. Para cambiar algún valor, copiar el archivo de ejemplo y
editarlo:

```bash
cd backend
cp .env.example .env
```

| Variable | Por defecto | Para qué sirve |
| --- | --- | --- |
| `PORT` | `3000` | Puerto del BFF |
| `POKEAPI_BASE_URL` | `https://pokeapi.co/api/v2` | Fuente de datos |
| `POKEAPI_TIMEOUT_MS` | `5000` | Tiempo máximo de espera a PokéAPI antes de responder 502 |
| `CACHE_TTL_MS` | `3600000` (1 hora) | Cuánto tiempo se guardan en memoria las respuestas de PokéAPI |

Si se cambia `PORT`, actualizar también el destino del proxy en `frontend/proxy.conf.json`.

## API del BFF

| Endpoint | Respuesta |
| --- | --- |
| `GET /api/pokemon?limit=20&offset=0&search=pika` | `{ items: [{ id, name, image }], total, limit, offset }` |
| `GET /api/pokemon/:name` | `{ id, name, image, types, heightM, weightKg, abilities, stats }` |

`limit` entre 1 y 50 (por defecto 20), `offset` desde 0 y `search` opcional. Los errores
siempre tienen la forma `{ code, message }`: **400** parámetros inválidos, **404** Pokémon
inexistente, **502** PokéAPI no disponible y **500** error inesperado (sin detalles internos).

## Tests

```bash
cd backend
npm test                       # 9 tests: servicio, mapper y adaptador

cd ../frontend
npm test -- --watch=false      # 1 test de la estructura base
```

Los tests del BFF cubren las piezas con lógica propia: la búsqueda y paginación del servicio
(con el puerto reemplazado por un doble de prueba, sin red), la traducción de datos del mapper
y la traducción de errores y la caché del adaptador.

## Uso de inteligencia artificial

Usé **Claude Code** como herramienta de apoyo durante todo el desarrollo:

- **Como tutor**, para entender cada pieza antes de incorporarla, sobre todo la arquitectura
  hexagonal, que era la primera vez que aplicaba.
- **Para contrastar alternativas** antes de decidir. Cada decisión quedó registrada en
  ARCHITECTURE.md con lo que se descartó y por qué.
- **Para verificar en vez de asumir.** Se revisaron las versiones antes de instalar: NestJS 12 y
  las versiones nuevas de `@nestjs/axios` y `@nestjs/config` son solo ESM, por eso se fijó la
  línea compatible con NestJS 11. Además se probó cada etapa con peticiones reales y en el
  navegador. Así aparecieron dos problemas que un build no muestra: un error de la plantilla de
  NestJS en el test e2e, y que PokéAPI responde 403 a nombres con caracteres especiales, lo que
  antes se informaba como "servicio caído".

Las decisiones de alcance y de diseño, y su revisión, fueron mías. Varias propuestas de la IA se
simplificaron o descartaron por exceder lo que pedía la prueba.

## Agradecimiento

Gracias por la oportunidad de hacer esta prueba. Más allá del resultado, me sirvió mucho para
entender en la práctica la arquitectura hexagonal: separar el dominio de la infraestructura,
invertir la dependencia con un puerto propio y ver cómo eso permite testear y cambiar la fuente
de datos sin tocar el núcleo.
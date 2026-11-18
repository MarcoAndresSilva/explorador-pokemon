# Arquitectura y decisiones técnicas

## Árbol de decisiones

```
Problema: explorar, buscar y ver detalle de Pokémon desde una web,
          pasando obligatoriamente por un BFF
│
├── D1 Alcance: catálogo + búsqueda parcial + detalle; nada más
│
├── D2 Repositorio: un solo repo con dos proyectos independientes (backend/, frontend/)
│
├── D3 BFF: NestJS 11 (CommonJS) en lugar de NestJS 12 (ESM)
│   └── Jest estable, sin modo experimental de Node
│
├── D4 Front: Angular 21, fijado por enunciado
│   ├── standalone + signals + zoneless (defaults de la versión)
│   ├── D10 Proxy de desarrollo hacia el BFF + HttpClient en un único servicio
│   └── D11 Catálogo con botón "Cargar más" y páginas cargadas bajo demanda
│
├── D5 Arquitectura del BFF: hexagonal liviana
│   ├── puerto solo hacia PokéAPI (única dependencia externa)
│   ├── un único servicio de aplicación (sin casos de uso separados)
│   ├── búsqueda y paginación en el servicio, no en el puerto
│   │
│   └── D6 Dominio sin dependencias externas
│       ├── datos como interfaces (resumen + detalle)
│       └── errores propios en vez de excepciones HTTP de Nest
│
└── D7 Contrato del BFF (deriva de D1 y de las pantallas del front)
    ├── GET /api/pokemon: catálogo y búsqueda en un mismo endpoint, paginado
    ├── GET /api/pokemon/:name: detalle
    ├── errores con forma única { code, message }
    │
    └── D8 Validar la entrada y responder errores con un formato único
        │
        └── D9 Caché en memoria, timeout y configuración en .env
```

## Decisiones

| | Elegido | Descartado | Por qué | Costo aceptado |
| --- | --- | --- | --- | --- |
| D1 | Catálogo, búsqueda parcial y detalle | Auth, BD, favoritos, SSR, i18n, e2e, evoluciones | Es lo que pide el enunciado; el resto no aporta al objetivo | Funcionalidad limitada a propósito |
| D2 | Un repo, dos carpetas con su propio `package.json` | Dos repos; monorepo con Nx/workspaces | Una sola URL para clonar; sin código compartido, un monorepo no resuelve nada | Tipos del contrato declarados en los dos lados |
| D3 | NestJS 11 (CommonJS) | NestJS 12 (ESM) con Vitest o con Jest experimental | Jest estable y ecosistema consolidado | Las librerías `@nestjs/*` quedan en su línea compatible con Nest 11 (sus versiones nuevas también son ESM); migrar más adelante no cambia la arquitectura |
| D4 | Angular 21 vía `npx @angular/cli@21` | Angular 22; CLI global (v20) | Cumple el enunciado y fija la versión en el proyecto | Ninguno relevante |
| D5 | Hexagonal liviana: un puerto hacia PokéAPI y un servicio | Servicio acoplado a PokéAPI; hexagonal completa | Testear sin red y aislar el formato externo donde hay riesgo real; sin capas de más | Lista completa filtrada en memoria (~1.300 elementos, cacheada) |
| D6 | Dominio sin dependencias; errores de dominio propios | Lanzar excepciones HTTP de Nest desde el adaptador | El núcleo no conoce HTTP; un exception filter traduce a 404/502 | Un archivo más (el filtro) |
| D7 | Catálogo y búsqueda en un mismo endpoint | Endpoint de búsqueda separado | Buscar es filtrar el catálogo y devuelve la misma forma | Cambiar el contrato exige cambiar BFF y front a la vez |
| D8 | Validar los parámetros antes de procesarlos y responder errores con forma `{ code, message }` | Validar a mano en cada método | Un parámetro inválido se rechaza con 400 sin llegar a la lógica. Un nombre con caracteres raros se rechaza antes de llamar a PokéAPI | Ninguno relevante |
| D9 | Caché en memoria (1 hora), timeout de 5 segundos y configuración en `.env` con valores por defecto | Redis u otra librería de caché | Los datos casi no cambian y hay un solo servidor: guardarlos en memoria basta | La caché se pierde al reiniciar el servidor |
| D10 | Proxy de Angular (`/api` → `localhost:3000`) y un único servicio `PokemonApi` con `HttpClient` | Llamar al BFF por URL absoluta; `httpResource` (experimental); interceptor de errores | El navegador ve un solo origen y no necesita CORS en local. Los errores se reducen a dos casos que la pantalla sabe mostrar: no encontrado o servicio no disponible | El contrato se repite en los modelos del front (D2) |
| D11 | Botón "Cargar más" (24 por vez) y rutas con carga diferida | Paginación con números; scroll infinito | Explorar es recorrer: sumar resultados es más cómodo que saltar de página y más simple y accesible que el scroll infinito | La lista crece en memoria mientras se carga más |

## Contrato del BFF

| Endpoint | Uso | Respuesta |
| --- | --- | --- |
| `GET /api/pokemon?limit=20&offset=0` | Catálogo paginado | `{ items: [{ id, name, image }], total, limit, offset }` |
| `GET /api/pokemon?search=pika&limit=20&offset=0` | Búsqueda parcial | Igual, filtrada |
| `GET /api/pokemon/:name` | Detalle | `{ id, name, image, types, heightM, weightKg, abilities, stats }` |

`limit` 1-50 (por defecto 20), `offset` >= 0 (por defecto 0), `search` opcional; parámetros
desconocidos se rechazan.

Errores `{ code, message }`: 400 parámetros inválidos, 404 Pokémon inexistente, 502 PokéAPI no
disponible, 500 error inesperado (sin detalle interno).

## Piezas del BFF

| Pieza | Rol | Conoce |
| --- | --- | --- |
| `PokemonController` | Adaptador de entrada | HTTP, DTOs, servicio |
| `PokemonService` | Núcleo: normaliza, filtra, pagina | Puerto y dominio |
| `PokemonProvider` | Puerto (clase abstracta, usable como token de inyección) | Solo dominio |
| `PokeApiAdapter` | Adaptador de salida + mapper (capa anti-corrupción) | HTTP, formato de PokéAPI, caché |

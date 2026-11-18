# Arquitectura y decisiones técnicas

Diario de las decisiones del proyecto: qué se construyó, cómo y por qué se eligió cada camino
frente a las alternativas.

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
│   └── permite Jest estable, sin modo experimental de Node
│
├── D4 Front: Angular 21, fijado por enunciado
│   └── standalone + signals + zoneless (defaults de la versión)
│
└── D5 Arquitectura del BFF: hexagonal liviana
    ├── puerto solo hacia PokéAPI (única dependencia externa)
    ├── un único servicio de aplicación (sin casos de uso separados)
    └── búsqueda y paginación en el servicio, no en el puerto
```

---

## D1. Alcance

**Contexto.** El enunciado pide que la persona pueda explorar un catálogo, encontrar un Pokémon
por nombre y ver la información relevante de uno, todo a través de un BFF.

**Decisión.** Tres capacidades: catálogo paginado, búsqueda parcial por nombre y detalle (imagen,
tipos, altura, peso, habilidades y estadísticas).

**Fuera de alcance, a propósito:**

| Excluido | Por qué |
| --- | --- |
| Autenticación | No hay datos de usuario que proteger |
| Base de datos | Los datos vienen de PokéAPI y casi no cambian; basta con caché en memoria |
| Favoritos persistentes | Requieren identidad o almacenamiento; no los pide el enunciado |
| SSR | Es una herramienta de exploración, no un sitio que necesite SEO |
| i18n | Un solo idioma alcanza para el objetivo |
| Tests e2e | El presupuesto de tiempo va a tests unitarios del BFF, donde está la lógica |
| Especie, evoluciones, descripciones | Son otros endpoints de PokéAPI y multiplican llamadas y casos de error |

**Consecuencia.** Cada funcionalidad nueva tiene que justificarse contra este alcance antes de
entrar.

---

## D2. Un repositorio con dos proyectos independientes

**Contexto.** La entrega es un repositorio público que contenga el front y el BFF.

**Opciones.**
1. Dos repositorios separados.
2. Monorepo con herramienta (Nx, workspaces de npm).
3. Un repositorio con dos carpetas, cada una con su propio `package.json`.

**Decisión.** Opción 3.

**Razones.** Quien evalúa clona una sola URL. Una herramienta de monorepo agrega configuración
y conceptos nuevos, y no resuelve ningún problema real cuando son solo dos proyectos que no
comparten código. Cada proyecto se instala, se prueba y se ejecuta por separado.

**Consecuencias.** Los tipos de las respuestas HTTP se escriben dos veces (una en el BFF y otra
en el front). Se acepta: son pocos, y justamente marcan el acuerdo entre ambos lados.

---

## D3. NestJS 11 en lugar de NestJS 12

**Contexto.** NestJS 12, la versión más nueva, usa ESM (el sistema de módulos moderno de
JavaScript, con `import`/`export` nativos). Jest, la herramienta de tests más usada con NestJS,
todavía no se lleva bien con ESM: o se cambia por Vitest, o se ejecuta con una opción
experimental de Node (`--experimental-vm-modules`). El enunciado no exige una versión de NestJS.

**Opciones.**
1. NestJS 12 con Vitest.
2. NestJS 12 con Jest en modo experimental.
3. NestJS 11, que usa CommonJS (el sistema de módulos clásico de Node, con `require`) y sigue
   con soporte vigente.

**Decisión.** Opción 3.

**Razones.**
- Con CommonJS, Jest funciona tal cual, sin opciones experimentales ni configuración extra.
- Las librerías que va a usar el BFF (`@nestjs/testing`, `@nestjs/axios`, `@nestjs/config`,
  `class-validator`) tienen mucha documentación y ejemplos para esta versión.
- Pasar después a NestJS 12 no cambia la arquitectura: solo cambia el sistema de módulos y la
  herramienta de tests.

---

## D4. Angular 21

**Contexto.** El enunciado exige Angular 21. La versión más nueva publicada es la 22, y la CLI
de Angular instalada globalmente en la máquina de desarrollo es la 20.

**Opciones.**
1. Usar Angular 22, la más nueva.
2. Crear el proyecto con la CLI global (`ng new`).
3. Crear el proyecto con `npx @angular/cli@21`.

**Decisión.** Opción 3.

**Razones.**
- La opción 1 no cumple el enunciado.
- La opción 2 generaría un proyecto Angular 20, porque usa la CLI que esté instalada en la
  máquina, sea cual sea su versión.
- Con la opción 3, `npx` descarga y ejecuta la CLI exactamente en la versión 21, sin importar
  qué haya instalado. El proyecto queda con Angular 21 fijado en su `package.json`, y quien
  clone el repositorio usa esa misma versión.

**Consecuencias.** Se adoptan los defaults de la versión: componentes standalone (sin
`NgModule`), signals para el estado, detección de cambios sin zone.js y Vitest para los tests.
Ir contra los defaults del framework agrega trabajo y no aporta nada.

---

## D5. Hexagonal liviana en el BFF

**Contexto.** El BFF depende de un solo servicio externo: PokéAPI. Eso trae tres problemas:
- Sus datos no vienen como los necesita el front. Por ejemplo, la altura viene en decímetros y
  el id viene escondido dentro de una URL.
- No permite buscar por parte del nombre.
- Puede fallar o tardar en responder.

**Opciones.**
1. Un servicio que llama a PokéAPI directamente.
2. Hexagonal completa: puertos de entrada y de salida, una clase por cada caso de uso y
   entidades con comportamiento.
3. Hexagonal liviana: un solo puerto, hacia PokéAPI, y un solo servicio.

**Decisión.** Opción 3.

**Razones.**
- **El servicio no sabe que PokéAPI existe.** Solo conoce un contrato propio, `PokemonProvider`
  (el puerto), que dice qué datos necesita sin decir de dónde salen. Gracias a eso:
  - En los tests se le entrega un proveedor falso y se prueba la lógica sin internet.
  - Si mañana los datos vienen de otra fuente, se escribe otro adaptador y el servicio no se
    toca.
- **Un solo traductor.** El adaptador recibe los datos de PokéAPI y un mapper los convierte a
  nuestros propios tipos (a esto se le llama capa anti-corrupción: el formato ajeno no entra al
  resto del código). Si PokéAPI cambia algo, se corrige solo el mapper.
- **No hace falta más.** El resto de la lógica es poca: normalizar el texto, filtrar y paginar.
  Separarla en más clases o más puertos sumaría archivos sin hacer el código más fácil de
  cambiar.

**Quién hace qué.**

| Pieza | Rol | Conoce |
| --- | --- | --- |
| `PokemonController` | Adaptador de entrada: recibe las peticiones HTTP | HTTP, DTOs, servicio |
| `PokemonService` | Núcleo: la lógica propia | Puerto y tipos de dominio |
| `PokemonProvider` | Puerto: el contrato | Solo tipos de dominio |
| `PokeApiAdapter` | Adaptador de salida: habla con PokéAPI | HTTP, formato de PokéAPI, mapper, caché |

**Por qué el puerto es una clase abstracta y no una interface.** Las interfaces de TypeScript
solo existen mientras se escribe el código; al compilar a JavaScript se borran. NestJS necesita
algo que siga existiendo al ejecutar la aplicación para saber qué inyectar, y una clase
abstracta sí sigue existiendo. Así, en el módulo se puede decir "cuando alguien pida un
`PokemonProvider`, entrégale un `PokeApiAdapter`":

```ts
{ provide: PokemonProvider, useClass: PokeApiAdapter }
```

En los tests se cambia esa línea por `useValue` con un objeto falso, y el servicio no nota la
diferencia.

**Búsqueda y paginación en el servicio, no en el puerto.** PokéAPI no sabe buscar por parte del
nombre, así que esa lógica es nuestra. Si el puerto tuviera un método `search(text)`, cualquier
fuente futura estaría obligada a implementarlo. El puerto pide solo lo que una fuente puede dar
(`listAll`, `getByName`) y el servicio hace el resto.

**Consecuencias.** El servicio recibe la lista completa (unos 1.300 elementos livianos) y filtra
en memoria. Es aceptable por el tamaño de la lista y porque el adaptador la guarda en caché.

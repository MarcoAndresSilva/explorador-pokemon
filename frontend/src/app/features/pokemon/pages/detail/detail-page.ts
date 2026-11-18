import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { DisplayNamePipe } from '../../../../shared/display-name.pipe';
import { ApiErrorKind, PokemonApi, toApiErrorKind } from '../../data-access/pokemon-api';
import { Pokemon } from '../../models/pokemon.models';

type DetailState =
  { status: 'loading' } | { status: 'ready'; pokemon: Pokemon } | { status: ApiErrorKind };

// Valor base más alto entre todos los Pokémon; sirve de 100 % para las barras.
const MAX_STAT = 255;

const TYPE_LABELS: Record<string, string> = {
  normal: 'Normal',
  fire: 'Fuego',
  water: 'Agua',
  grass: 'Planta',
  electric: 'Eléctrico',
  ice: 'Hielo',
  fighting: 'Lucha',
  poison: 'Veneno',
  ground: 'Tierra',
  flying: 'Volador',
  psychic: 'Psíquico',
  bug: 'Bicho',
  rock: 'Roca',
  ghost: 'Fantasma',
  dragon: 'Dragón',
  dark: 'Siniestro',
  steel: 'Acero',
  fairy: 'Hada',
};

const STAT_LABELS: Record<string, string> = {
  hp: 'PS',
  attack: 'Ataque',
  defense: 'Defensa',
  'special-attack': 'Ataque especial',
  'special-defense': 'Defensa especial',
  speed: 'Velocidad',
};

@Component({
  selector: 'app-detail-page',
  imports: [RouterLink, DisplayNamePipe],
  templateUrl: './detail-page.html',
  styleUrl: './detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailPage {
  private readonly api = inject(PokemonApi);

  readonly name = input.required<string>();
  protected readonly state = signal<DetailState>({ status: 'loading' });

  constructor() {
    toObservable(this.name)
      .pipe(
        switchMap((name) => this.load(name)),
        takeUntilDestroyed(),
      )
      .subscribe((state) => this.state.set(state));
  }

  protected typeLabel(type: string): string {
    return TYPE_LABELS[type] ?? type;
  }

  protected statLabel(name: string): string {
    return STAT_LABELS[name] ?? name;
  }

  protected statPercent(value: number): number {
    return Math.min(100, (value / MAX_STAT) * 100);
  }

  protected retry(): void {
    this.load(this.name()).subscribe((state) => this.state.set(state));
  }

  private load(name: string) {
    return this.api.getByName(name).pipe(
      map((pokemon): DetailState => ({ status: 'ready', pokemon })),
      catchError((error: unknown) => of<DetailState>({ status: toApiErrorKind(error) })),
      startWith<DetailState>({ status: 'loading' }),
    );
  }
}

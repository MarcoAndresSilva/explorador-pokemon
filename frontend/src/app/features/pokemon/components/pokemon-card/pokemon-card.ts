import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DisplayNamePipe } from '../../../../shared/display-name.pipe';
import { PokemonSummary } from '../../models/pokemon.models';

@Component({
  selector: 'app-pokemon-card',
  imports: [RouterLink, DisplayNamePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="card" [routerLink]="['/pokemon', pokemon().name]">
      @if (imageFailed()) {
        <div class="placeholder" aria-hidden="true">?</div>
      } @else {
        <img
          [src]="pokemon().image"
          [alt]="pokemon().name | displayName"
          loading="lazy"
          (error)="imageFailed.set(true)"
        />
      }
      <span class="number">#{{ pokemon().id }}</span>
      <span class="name">{{ pokemon().name | displayName }}</span>
    </a>
  `,
  styles: `
    .card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      background: var(--color-surface);
      color: inherit;
      text-decoration: none;
      transition:
        transform 0.15s ease,
        box-shadow 0.15s ease;
    }
    .card:hover,
    .card:focus-visible {
      transform: translateY(-3px);
      box-shadow: 0 6px 16px rgb(0 0 0 / 8%);
    }
    img,
    .placeholder {
      width: 120px;
      height: 120px;
      object-fit: contain;
    }
    .placeholder {
      display: grid;
      place-items: center;
      font-size: 2.5rem;
      color: var(--color-border);
    }
    .number {
      font-size: 0.8rem;
      color: var(--color-muted);
    }
    .name {
      font-weight: 600;
      text-transform: capitalize;
    }
  `,
})
export class PokemonCard {
  readonly pokemon = input.required<PokemonSummary>();
  protected readonly imageFailed = signal(false);
}

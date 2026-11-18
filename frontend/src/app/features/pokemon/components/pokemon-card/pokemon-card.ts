import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { DisplayNamePipe } from '../../../../shared/display-name.pipe';
import { PokemonSummary } from '../../models/pokemon.models';

@Component({
  selector: 'app-pokemon-card',
  imports: [RouterLink, MatCardModule, MatIconModule, DisplayNamePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="link" [routerLink]="['/pokemon', pokemon().name]">
      <mat-card class="card" appearance="outlined">
        @if (imageFailed()) {
          <mat-icon class="placeholder" aria-hidden="true">image_not_supported</mat-icon>
        } @else {
          <img
            [src]="pokemon().image"
            [alt]="pokemon().name | displayName"
            loading="lazy"
            (error)="imageFailed.set(true)"
          />
        }
        <span class="number">N.º {{ pokemon().id }}</span>
        <span class="name">{{ pokemon().name | displayName }}</span>
      </mat-card>
    </a>
  `,
  styles: `
    .link {
      display: block;
      color: inherit;
      text-decoration: none;
      border-radius: 12px;
    }
    .card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1rem 0.75rem;
      transition:
        transform 0.15s ease,
        box-shadow 0.15s ease;
    }
    .link:hover .card,
    .link:focus-visible .card {
      transform: translateY(-3px);
      box-shadow: var(--mat-sys-level3);
    }
    img {
      width: 120px;
      height: 120px;
      object-fit: contain;
    }
    .placeholder {
      width: 120px;
      height: 120px;
      font-size: 64px;
      line-height: 120px;
      text-align: center;
      color: var(--mat-sys-outline-variant);
    }
    .number {
      font: var(--mat-sys-label-medium);
      color: var(--mat-sys-on-surface-variant);
    }
    .name {
      font: var(--mat-sys-title-medium);
      text-transform: capitalize;
      text-align: center;
    }
  `,
})
export class PokemonCard {
  readonly pokemon = input.required<PokemonSummary>();
  protected readonly imageFailed = signal(false);
}

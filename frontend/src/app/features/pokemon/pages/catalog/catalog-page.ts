import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, catchError, debounceTime, distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { PokemonCard } from '../../components/pokemon-card/pokemon-card';
import { PokemonApi } from '../../data-access/pokemon-api';
import { PokemonPage, PokemonSummary } from '../../models/pokemon.models';

const PAGE_SIZE = 24;

type Status = 'loading' | 'ready' | 'error';

interface PageRequest {
  search: string;
  offset: number;
}

@Component({
  selector: 'app-catalog-page',
  imports: [
    PokemonCard,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './catalog-page.html',
  styleUrl: './catalog-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogPage {
  private readonly api = inject(PokemonApi);
  private readonly pageRequests = new Subject<PageRequest>();
  private lastRequest: PageRequest = { search: '', offset: 0 };

  protected readonly search = signal('');
  protected readonly pokemon = signal<PokemonSummary[]>([]);
  protected readonly total = signal(0);
  protected readonly status = signal<Status>('loading');
  protected readonly hasMore = computed(() => this.pokemon().length < this.total());

  constructor() {
    toObservable(this.search)
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((search) => this.pageRequests.next({ search, offset: 0 }));

    // switchMap descarta la respuesta anterior si llega una búsqueda nueva antes.
    this.pageRequests
      .pipe(
        switchMap((request) => this.fetchPage(request)),
        takeUntilDestroyed(),
      )
      .subscribe((result) => this.applyResult(result));
  }

  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  protected clearSearch(): void {
    this.search.set('');
  }

  protected loadMore(): void {
    this.pageRequests.next({ search: this.search(), offset: this.pokemon().length });
  }

  protected retry(): void {
    this.pageRequests.next(this.lastRequest);
  }

  private fetchPage(request: PageRequest) {
    this.lastRequest = request;
    this.status.set('loading');
    return this.api.list({ ...request, limit: PAGE_SIZE }).pipe(
      map((page) => ({ request, page })),
      catchError(() => of({ request, page: null })),
    );
  }

  private applyResult(result: { request: PageRequest; page: PokemonPage | null }): void {
    if (!result.page) {
      this.status.set('error');
      return;
    }
    const { items, total } = result.page;
    this.pokemon.update((current) =>
      result.request.offset === 0 ? items : [...current, ...items],
    );
    this.total.set(total);
    this.status.set('ready');
  }
}

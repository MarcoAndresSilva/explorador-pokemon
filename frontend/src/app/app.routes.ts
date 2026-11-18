import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'pokemon' },
  {
    path: 'pokemon',
    loadComponent: () =>
      import('./features/pokemon/pages/catalog/catalog-page').then((m) => m.CatalogPage),
  },
  {
    path: 'pokemon/:name',
    loadComponent: () =>
      import('./features/pokemon/pages/detail/detail-page').then((m) => m.DetailPage),
  },
  { path: '**', redirectTo: 'pokemon' },
];

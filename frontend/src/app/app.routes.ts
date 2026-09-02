import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: 'connexion',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'inscription',
    loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
  },
  {
    path: 'formations',
    loadComponent: () => import('./features/catalog/catalog-list/catalog-list').then((m) => m.CatalogList),
  },
  {
    path: 'formations/:id',
    loadComponent: () => import('./features/catalog/permit-detail/permit-detail').then((m) => m.PermitDetail),
  },
  { path: '**', redirectTo: '' },
];

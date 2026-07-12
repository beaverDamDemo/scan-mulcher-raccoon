import { Routes } from '@angular/router';

import { App } from './app';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: App,
  },
  {
    path: 'ricerca-mazze',
    loadComponent: () =>
      import('./pages/ricerca-mazze/ricerca-mazze').then((module) => module.RicercaMazze),
  },
];

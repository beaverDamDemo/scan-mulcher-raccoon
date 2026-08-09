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
  {
    path: 'ricerca-pezzi-di-ricambio',
    loadComponent: () =>
      import('./pages/ricerca-pezzi-di-ricambio/ricerca-pezzi-di-ricambio').then((module) => module.RicercaPezziDiRicambio),
  },
  {
    path: 'recognize-the-tractor',
    loadComponent: () =>
      import('./pages/recognize-the-tractor/recognize-the-tractor').then((module) => module.RecognizeTheTractor),
  },
];

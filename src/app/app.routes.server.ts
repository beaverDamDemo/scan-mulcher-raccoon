import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'ricerca-mazze',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'ricerca-pezzi-di-ricambio',
    renderMode: RenderMode.Prerender,
  },
  {
    path: '**',
    renderMode: RenderMode.Server,
  },
];

import { Component, input, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-page-header',
  imports: [NgOptimizedImage, RouterLink, RouterLinkActive],
  templateUrl: './page-header.html',
  styleUrl: './page-header.css',
})
export class PageHeader {
  readonly title = input<string>('');
  readonly backLink = input<string | null>(null);
  protected readonly navigationOpen = signal(false);
  protected readonly navigationItems = [
    { label: 'Ricerca Mazze', link: '/ricerca-mazze' },
    { label: 'Ricerca Ricambi', link: '/ricerca-pezzi-di-ricambio' },
    { label: 'Riconosci Trattori', link: '/riconosci-trattori' },
  ];

  protected toggleNavigation(): void {
    this.navigationOpen.update((isOpen) => !isOpen);
  }

  protected closeNavigation(): void {
    this.navigationOpen.set(false);
  }
}

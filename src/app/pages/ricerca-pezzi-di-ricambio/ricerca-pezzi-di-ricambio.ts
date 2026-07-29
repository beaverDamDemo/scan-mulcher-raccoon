import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { PageHeader } from '../../components/page-header/page-header';

const URL_STORAGE_KEY = 'scan-mulcher-ricerca-pezzi-urls';
const MAX_URLS = 6;

@Component({
  selector: 'app-ricerca-pezzi-di-ricambio',
  imports: [PageHeader],
  templateUrl: './ricerca-pezzi-di-ricambio.html',
  styleUrl: './ricerca-pezzi-di-ricambio.css',
})
export class RicercaPezziDiRicambio {
  private readonly platformId = inject(PLATFORM_ID);
  protected readonly query = signal('');
  protected readonly debouncedQuery = signal('');
  protected readonly urls = signal<string[]>(['']);
  protected readonly enteredUrls = computed(() => this.urls().filter(u => u.trim() !== ''));
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.restoreUrls();
  }

  onKeyUp(event: KeyboardEvent): void {
    const target = event.target as HTMLInputElement;
    const value = target?.value ?? '';
    this.query.set(value);
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.debouncedQuery.set(value);
      this.debounceTimer = null;
    }, 400);
  }

  onUrlInput(index: number, event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target?.value ?? '';
    this.urls.update(arr => {
      const copy = arr.slice();
      copy[index] = value;
      return copy;
    });
    if (value.trim() !== '') {
      this.maybeAppendInput(index);
    }
    this.saveUrls();
  }

  onUrlKeyDown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.maybeAppendInput(index);
    }
  }

  clearUrl(index: number): void {
    this.urls.update(urls => {
      const copy = urls.slice();
      copy[index] = '';
      return copy;
    });
    this.saveUrls();
  }

  onCerca(): void {
  }

  private maybeAppendInput(index: number): void {
    const list = this.urls();
    if (index === list.length - 1 && list.length < MAX_URLS && list[index].trim() !== '') {
      this.urls.update(arr => {
        const copy = arr.slice();
        copy.push('');
        return copy;
      });
    }
  }

  private restoreUrls(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      const savedUrls: unknown = JSON.parse(localStorage.getItem(URL_STORAGE_KEY) ?? '[]');
      if (Array.isArray(savedUrls)) {
        const urls = savedUrls.filter((url): url is string => typeof url === 'string').slice(0, MAX_URLS);
        this.urls.set(urls.length > 0 ? urls : ['']);
      }
    } catch {
      this.urls.set(['']);
    }
  }

  private saveUrls(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      localStorage.setItem(URL_STORAGE_KEY, JSON.stringify(this.urls()));
    } catch {
      // Storage may be unavailable or full; URL entry remains usable for this session.
    }
  }
}



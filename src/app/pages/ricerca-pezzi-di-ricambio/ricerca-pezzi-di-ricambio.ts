import { isPlatformBrowser, NgIf, NgForOf } from '@angular/common';
import { Component, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { PageHeader } from '../../components/page-header/page-header';

const URL_STORAGE_KEY = 'scan-mulcher-ricerca-pezzi-urls';
const MAX_URLS = 6;

@Component({
  selector: 'app-ricerca-pezzi-di-ricambio',
  imports: [PageHeader, NgIf, NgForOf],
  templateUrl: './ricerca-pezzi-di-ricambio.html',
  styleUrl: './ricerca-pezzi-di-ricambio.css',
})
export class RicercaPezziDiRicambio {
  private readonly platformId = inject(PLATFORM_ID);
  protected readonly query = signal('');
  protected readonly debouncedQuery = signal('');
  protected readonly urls = signal<string[]>([
    'https://www.ceneje.si/Iskanje/Izdelki?q=duraturn+2056016',
    'https://www.mimovrste.com/iskanje?src=sug&s=Duraturn%20205%2F60%20R16',
    '',
  ]);
  protected readonly enteredUrls = computed(() => this.urls().filter(u => u.trim() !== ''));
  protected readonly previewUrls = signal<string[]>([]);
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
    this.previewUrls.set(this.enteredUrls().filter(url => this.isPreviewableUrl(url)));
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

  private isPreviewableUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private restoreUrls(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      const raw = localStorage.getItem(URL_STORAGE_KEY);
      if (raw !== null) {
        const savedUrls: unknown = JSON.parse(raw);
        if (Array.isArray(savedUrls)) {
          const urls = savedUrls.filter((url): url is string => typeof url === 'string').slice(0, MAX_URLS);
          if (urls.length > 0) {
            // Merge saved values into current defaults: prefer non-empty saved entries,
            // but keep defaults when saved entries are empty.
            const base = this.urls().slice(0, MAX_URLS);
            const merged = base.slice();
            for (let i = 0; i < urls.length; i++) {
              const v = urls[i] ?? '';
              if (v.trim().length > 0) merged[i] = v;
            }
            this.urls.set(merged);
          }
        }
      }
    } catch {
      // If parsing fails, keep the current default urls signal.
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



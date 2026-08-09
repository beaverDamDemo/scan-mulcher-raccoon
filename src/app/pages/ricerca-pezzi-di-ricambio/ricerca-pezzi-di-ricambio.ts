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
  protected readonly urls = signal<string[]>(['', '', '', '', '', '']);
  protected readonly enteredUrls = computed(() => this.urls().filter(u => u.trim() !== ''));
  protected readonly previewUrls = signal<string[]>([]);
  protected readonly activeSite = signal<string | null>(null);
  // Map of site keys to URL templates. `{q}` will be replaced with `encodeURIComponent(query)`.
  private readonly SITE_TEMPLATES: Record<string, string> = {
    ceneje: 'https://www.ceneje.si/Iskanje/Izdelki?q={q}',
    mimovrste: 'https://www.mimovrste.com/iskanje?src=sug&s={q}',
    merkur: 'https://www.merkur.si/catalogsearch/result/index/?q={q}',
    bolha: 'https://www.bolha.com/search/?keywords=celoletne+{q}',
    bigbang: 'https://www.bigbang.si/izdelki/?search_q={q}',
    shoppster: 'https://www.shoppster.si/search/{q}',
  };
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Ensure inputs start empty by clearing any previously saved defaults
    // in localStorage for this page, then restore (which will keep empties).
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.removeItem(URL_STORAGE_KEY);
      } catch {
        // ignore storage errors
      }
    }

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

  onQueryFocus(event: FocusEvent): void {
    const input = event.target as HTMLInputElement | null;
    if (!input) return;
    const current = (input.value ?? '').trim();
    if (current === '') {
      const placeholder = input.placeholder ?? '';
      input.value = placeholder;
      // Select the inserted text so the user can type to replace it easily
      try { input.select(); } catch { }
      this.query.set(placeholder);
    }
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
    const urls = this.enteredUrls().filter(url => this.isPreviewableUrl(url));
    this.previewUrls.set(urls);

    if (isPlatformBrowser(this.platformId) && urls.length > 0) {
      try {
        // Create and click anchor elements synchronously so each click is treated
        // as part of the original user gesture. This increases the likelihood
        // that browsers will open multiple tabs instead of blocking them.
        for (const url of urls) {
          const a = document.createElement('a');
          a.href = url;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          // Some browsers require the element to be in the document to trigger a navigation
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      } catch (e) {
        // ignore failures to open tabs (popup blockers)
      }
    }
  }

  onSiteClick(site: string): void {
    const q = this.query().trim();
    if (!q) {
      // nothing to populate
      return;
    }

    const tmpl = this.SITE_TEMPLATES[site];
    if (!tmpl) return;

    const url = tmpl.replace('{q}', encodeURIComponent(q));

    // Insert into the first empty input, or push/replace if none available.
    this.urls.update(arr => {
      const copy = arr.slice();
      let idx = copy.findIndex(u => u.trim() === '');
      if (idx === -1) {
        if (copy.length < MAX_URLS) {
          copy.push(url);
        } else {
          copy[0] = url;
        }
      } else {
        copy[idx] = url;
      }

      // Ensure there's an empty trailing slot when possible
      if (copy.length < MAX_URLS && copy[copy.length - 1].trim() !== '') {
        copy.push('');
      }

      return copy;
    });

    this.saveUrls();

    // Toggle active state for the clicked site: clicking same site again clears it.
    this.activeSite.set(this.activeSite() === site ? null : site);
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



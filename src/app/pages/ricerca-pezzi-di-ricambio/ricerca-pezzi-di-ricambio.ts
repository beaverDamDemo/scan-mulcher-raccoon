import { isPlatformBrowser, NgIf, NgForOf } from '@angular/common';
import { Component, ElementRef, PLATFORM_ID, computed, effect, inject, signal, viewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PageHeader } from '../../components/page-header/page-header';

const URL_STORAGE_KEY = 'scan-mulcher-ricerca-pezzi-urls';
const SHOP_STORAGE_KEY = 'scan-mulcher-ricerca-pezzi-shops';
const REMOVED_DEFAULT_SHOPS_STORAGE_KEY = 'scan-mulcher-ricerca-pezzi-removed-default-shops';
const MAX_URLS = 6;
const SEARCH_PARAMETER_NAMES = new Set(['q', 'query', 's', 'search', 'keyword', 'keywords', 'term', 'text', 'search_q']);

interface SavedShop {
  name: string;
  sourceUrl: string;
  template: string;
  color: string;
}

interface DefaultShop {
  key: string;
  name: string;
  initial: string;
  style: string;
}

interface PreviewUrl {
  url: string;
  safeUrl: SafeResourceUrl;
}

const DEFAULT_SHOPS: readonly DefaultShop[] = [
  { key: 'ceneje', name: 'ceneje.si', initial: 'C', style: 'site-button--ceneje' },
  { key: 'mimovrste', name: 'mimovrste', initial: 'M', style: 'site-button--mimovrste' },
  { key: 'merkur', name: 'merkur', initial: 'Me', style: 'site-button--merkur' },
  { key: 'bolha', name: 'bolha.com', initial: 'B', style: 'site-button--bolha' },
  { key: 'bigbang', name: 'bigbang', initial: 'BB', style: 'site-button--bigbang' },
  { key: 'shoppster', name: 'shoppster', initial: 'S', style: 'site-button--shoppster' },
];

const SAVED_SHOP_COLORS = [
  'linear-gradient(90deg, #0f766e, #14b8a6)',
  'linear-gradient(90deg, #9a3412, #f97316)',
  'linear-gradient(90deg, #1d4ed8, #38bdf8)',
  'linear-gradient(90deg, #be123c, #fb7185)',
  'linear-gradient(90deg, #4d7c0f, #84cc16)',
  'linear-gradient(90deg, #7e22ce, #c084fc)',
] as const;

@Component({
  selector: 'app-ricerca-pezzi-di-ricambio',
  imports: [PageHeader, NgIf, NgForOf],
  templateUrl: './ricerca-pezzi-di-ricambio.html',
  styleUrl: './ricerca-pezzi-di-ricambio.css',
})
export class RicercaPezziDiRicambio {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly query = signal('');
  protected readonly debouncedQuery = signal('');
  protected readonly urls = signal<string[]>(['', '', '', '', '', '']);
  protected readonly enteredUrls = computed(() => this.urls().filter(u => u.trim() !== ''));
  protected readonly newShopUrl = signal('');
  protected readonly defaultShops = signal<DefaultShop[]>([...DEFAULT_SHOPS]);
  protected readonly savedShops = signal<SavedShop[]>([]);
  protected readonly shopUrlError = signal<string | null>(null);
  protected readonly isAddShopModalOpen = signal(false);
  protected readonly isResetConfirmationOpen = signal(false);
  protected readonly defaultShopPendingRemoval = signal<DefaultShop | null>(null);
  protected readonly shopPendingRemoval = signal<SavedShop | null>(null);
  protected readonly previewUrls = signal<PreviewUrl[]>([]);
  protected readonly activeSite = signal<string | null>(null);
  protected readonly addShopUrlInput = viewChild<ElementRef<HTMLInputElement>>('addShopUrlInput');
  // Map of site keys to URL templates. `{q}` will be replaced with `encodeURIComponent(query)`.
  private readonly SITE_TEMPLATES: Record<string, string> = {
    ceneje: 'https://www.ceneje.si/Iskanje/Izdelki?q={q}',
    mimovrste: 'https://www.mimovrste.com/iskanje?src=sug&s={q}',
    merkur: 'https://www.merkur.si/catalogsearch/result/index/?q={q}',
    bolha: 'https://www.bolha.com/search/?keywords={q}',
    bigbang: 'https://www.bigbang.si/izdelki/?search_q={q}',
    shoppster: 'https://www.shoppster.si/search/{q}',
  };
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private lastFocusedElement: HTMLElement | null = null;

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
    this.restoreDefaultShops();
    this.restoreSavedShopUrls();

    effect(() => {
      if (this.isAddShopModalOpen()) {
        this.addShopUrlInput()?.nativeElement.focus();
      }
    });
  }

  onQueryInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target?.value ?? '';
    this.query.set(value);
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.debouncedQuery.set(value);
      this.populateUrlsForQuery(value);
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

  openAddShopModal(): void {
    if (isPlatformBrowser(this.platformId)) {
      const activeElement = document.activeElement;
      this.lastFocusedElement = activeElement instanceof HTMLElement ? activeElement : null;
    }
    this.newShopUrl.set('');
    this.shopUrlError.set(null);
    this.isAddShopModalOpen.set(true);
  }

  closeAddShopModal(): void {
    this.isAddShopModalOpen.set(false);
    this.lastFocusedElement?.focus();
    this.lastFocusedElement = null;
  }

  onNewShopUrlInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.newShopUrl.set(target?.value ?? '');
    this.shopUrlError.set(null);
  }

  addShop(): void {
    const shop = this.createSavedShop(this.newShopUrl());
    if (shop === null) {
      this.shopUrlError.set('Inserisci un URL valido del negozio online.');
      return;
    }

    if (!this.savedShops().some(savedShop => savedShop.template === shop.template)) {
      this.savedShops.update(shops => [...shops, shop]);
      this.saveSavedShopUrls();
      this.populateUrlsForQuery(this.query());
    }

    this.closeAddShopModal();
  }

  requestShopRemoval(shop: SavedShop): void {
    this.shopPendingRemoval.set(shop);
  }

  requestDefaultShopRemoval(shop: DefaultShop): void {
    this.defaultShopPendingRemoval.set(shop);
  }

  cancelDefaultShopRemoval(): void {
    this.defaultShopPendingRemoval.set(null);
  }

  confirmDefaultShopRemoval(): void {
    const shop = this.defaultShopPendingRemoval();
    if (shop === null) {
      return;
    }

    this.defaultShops.update(shops => shops.filter(defaultShop => defaultShop.key !== shop.key));
    this.saveRemovedDefaultShops();
    this.populateUrlsForQuery(this.query());
    this.cancelDefaultShopRemoval();
  }

  requestShopReset(): void {
    this.isResetConfirmationOpen.set(true);
  }

  cancelShopReset(): void {
    this.isResetConfirmationOpen.set(false);
  }

  confirmShopReset(): void {
    this.defaultShops.set([...DEFAULT_SHOPS]);
    this.savedShops.set([]);
    this.activeSite.set(null);
    this.cancelDefaultShopRemoval();
    this.cancelShopRemoval();
    this.cancelShopReset();

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      localStorage.removeItem(REMOVED_DEFAULT_SHOPS_STORAGE_KEY);
      localStorage.removeItem(SHOP_STORAGE_KEY);
    } catch {
      // Storage may be unavailable; the reset remains active for this session.
    }
  }

  cancelShopRemoval(): void {
    this.shopPendingRemoval.set(null);
  }

  confirmShopRemoval(): void {
    const shop = this.shopPendingRemoval();
    if (shop === null) {
      return;
    }

    this.removeShop(shop.template);
    this.cancelShopRemoval();
  }

  private removeShop(shopTemplate: string): void {
    this.savedShops.update(shops => shops.filter(shop => shop.template !== shopTemplate));
    this.saveSavedShopUrls();
  }

  onCerca(): void {
    const urls = [...new Set(this.enteredUrls().filter(url => this.isPreviewableUrl(url)))];
    this.previewUrls.set(urls.map(url => ({
      url,
      safeUrl: this.sanitizer.bypassSecurityTrustResourceUrl(url),
    })));

    if (isPlatformBrowser(this.platformId) && urls.length > 0) {
      for (const url of urls) {
        this.openInNewTab(url);
      }
    }
  }

  private openInNewTab(url: string): void {
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      // ignore failures to open tabs (popup blockers)
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

  private populateUrlsForQuery(query: string): void {
    const trimmedQuery = query.trim();
    if (trimmedQuery === '') {
      this.urls.set([]);
      return;
    }

    const templates = [
      ...this.defaultShops().map(shop => this.SITE_TEMPLATES[shop.key]),
      ...this.savedShops().map(shop => shop.template),
    ].filter((template): template is string => template !== undefined);
    this.urls.set(templates.map(template => this.createShopSearchUrl(template, trimmedQuery)));
  }

  private isPreviewableUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private createShopSearchTemplate(value: string): string | null {
    try {
      const trimmedValue = value.trim();
      const parsedUrl = new URL(/^https?:\/\//i.test(trimmedValue) ? trimmedValue : `https://${trimmedValue}`);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        return null;
      }

      const searchParameter = [...parsedUrl.searchParams.keys()]
        .find(parameter => SEARCH_PARAMETER_NAMES.has(parameter.toLowerCase()));
      if (searchParameter !== undefined) {
        parsedUrl.searchParams.set(searchParameter, '{q}');
        return parsedUrl.toString().replace('%7Bq%7D', '{q}');
      }

      const pathWithTemplate = parsedUrl.pathname.replace(
        /\/(q|query|s|search|keyword|keywords|term|text)=([^/?#]+)/i,
        '/$1={q}',
      );
      if (pathWithTemplate !== parsedUrl.pathname) {
        parsedUrl.pathname = pathWithTemplate;
        return parsedUrl.toString().replace('%7Bq%7D', '{q}');
      }

      parsedUrl.searchParams.set('q', '{q}');
      return parsedUrl.toString().replace('%7Bq%7D', '{q}');
    } catch {
      return null;
    }
  }

  private createSavedShop(value: string, color = this.nextSavedShopColor()): SavedShop | null {
    try {
      const trimmedValue = value.trim();
      const sourceUrl = new URL(/^https?:\/\//i.test(trimmedValue) ? trimmedValue : `https://${trimmedValue}`);
      const template = this.createShopSearchTemplate(sourceUrl.toString());
      if (template === null) {
        return null;
      }

      return {
        name: this.createShopName(sourceUrl.hostname),
        sourceUrl: sourceUrl.toString(),
        template,
        color,
      };
    } catch {
      return null;
    }
  }

  private createShopName(hostname: string): string {
    const domain = hostname.replace(/^www\./i, '').split('.')[0] ?? hostname;
    return domain.replace(/[-_]+/g, ' ').replace(/\b\w/g, character => character.toUpperCase());
  }

  private nextSavedShopColor(): string {
    return SAVED_SHOP_COLORS[this.savedShops().length % SAVED_SHOP_COLORS.length];
  }

  protected createShopSearchUrl(template: string, query: string): string {
    return template.replace('{q}', encodeURIComponent(query.trim()));
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

  private restoreDefaultShops(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      const raw = localStorage.getItem(REMOVED_DEFAULT_SHOPS_STORAGE_KEY);
      const removedKeys: unknown = raw === null ? [] : JSON.parse(raw);
      if (Array.isArray(removedKeys)) {
        const removed = new Set(removedKeys.filter((key): key is string => typeof key === 'string'));
        this.defaultShops.set(DEFAULT_SHOPS.filter(shop => !removed.has(shop.key)));
      }
    } catch {
      // If parsing fails, keep all default shops visible.
    }
  }

  private saveRemovedDefaultShops(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      const visibleKeys = new Set(this.defaultShops().map(shop => shop.key));
      const removedKeys = DEFAULT_SHOPS
        .filter(shop => !visibleKeys.has(shop.key))
        .map(shop => shop.key);
      localStorage.setItem(REMOVED_DEFAULT_SHOPS_STORAGE_KEY, JSON.stringify(removedKeys));
    } catch {
      // Storage may be unavailable; removal remains active for this session.
    }
  }

  private restoreSavedShopUrls(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      const raw = localStorage.getItem(SHOP_STORAGE_KEY);
      if (raw !== null) {
        const savedUrls: unknown = JSON.parse(raw);
        if (Array.isArray(savedUrls)) {
          const shops = savedUrls
            .map((savedShop, index) => this.restoreSavedShop(savedShop, SAVED_SHOP_COLORS[index % SAVED_SHOP_COLORS.length]))
            .filter((savedShop): savedShop is SavedShop => savedShop !== null);
          this.savedShops.set(shops.filter((shop, index) =>
            shops.findIndex(candidate => candidate.template === shop.template) === index,
          ));
        }
      }
    } catch {
      // If parsing fails, no saved shop URLs are restored.
    }
  }

  private restoreSavedShop(value: unknown, fallbackColor: string): SavedShop | null {
    if (typeof value === 'string') {
      return this.createSavedShop(value, fallbackColor);
    }

    if (typeof value === 'object' && value !== null && 'sourceUrl' in value && typeof value.sourceUrl === 'string') {
      const color = 'color' in value && typeof value.color === 'string' ? value.color : fallbackColor;
      return this.createSavedShop(value.sourceUrl, color);
    }

    return null;
  }

  private saveSavedShopUrls(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      localStorage.setItem(SHOP_STORAGE_KEY, JSON.stringify(this.savedShops()));
    } catch {
      // Storage may be unavailable or full; the shop remains available for this session.
    }
  }

}



import { isPlatformBrowser, NgOptimizedImage } from '@angular/common';
import { Component, PLATFORM_ID, computed, inject, signal, Signal, WritableSignal } from '@angular/core';
import { PageHeader } from '../../components/page-header/page-header';
import masterData from './mazze-master.json';

// Supported Dropbox set IDs (44..52 and 52a)
const SUPPORTED_DROPBOX_SET_IDS = ['44', '45', '46', '47', '48', '49', '50', '51', '52', '52a'] as const;

// Defaults can be provided here per-set if available; otherwise leave empty string.
const DEFAULT_DROPBOX_LINKS: Record<string, string> = {
  '44': 'https://www.dropbox.com/scl/fi/90ta6toz9hcygg6axkkxl/mazze-set-44.png?rlkey=cczqu75ey7avrweyjrura70u3&st=i5zfj90e&dl=0',
  '45': 'https://www.dropbox.com/scl/fi/piodwq6wokb92fzcmly70/mazze-set-45.png?rlkey=gfavava836qfwnh466sb3mu8y&st=9opm3b61&dl=0',
  '46': '',
  '47': '',
  '48': '',
  '49': '',
  '50': '',
  '51': '',
  '52': '',
  '52a': '',
};

function convertDropboxShareUrlToDirect(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);

    if (parsed.hostname === 'www.dropbox.com' || parsed.hostname === 'dropbox.com') {
      parsed.searchParams.set('raw', '1');
      parsed.searchParams.delete('dl');
      return parsed.toString();
    }
  } catch {
    // Not a valid URL; return as-is and let the browser attempt to load it.
  }

  return trimmed;
}

interface BladeRecord {
  pageTag: string;
  articolo: string;
  aMm: string;
  bMm: string;
  foroOrAsola: string;
  rMm: string;
  pesoKg: string;
  applicazioni: string;
  index: number;
}

type BladeSortColumn = keyof BladeRecord;
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-ricerca-mazze',
  imports: [NgOptimizedImage, PageHeader],
  templateUrl: './ricerca-mazze.html',
  styleUrl: './ricerca-mazze.css',
})
export class RicercaMazze {
  private readonly platformId = inject(PLATFORM_ID);
  constructor() {
    // initialize dynamic link drafts and computed direct links for supported sets
    for (const id of this.mazzeSetIds) {
      const key = `scan-mulcher-mazze-${id}-link`;
      const defaultValue = DEFAULT_DROPBOX_LINKS[id] ?? '';
      const draft = signal<string>(this.readMazzeLink(key, defaultValue));
      this.mazzeLinkDrafts.set(id, draft);
      this.mazzeLinks.set(id, computed<string>(() => {
        const direct = convertDropboxShareUrlToDirect(draft());
        return this.maybeProxyDropbox(direct);
      }));
    }
    // Preload configured Dropbox images on page load (browser only)
    if (isPlatformBrowser(this.platformId)) {
      // schedule async so constructor finishes quickly
      setTimeout(() => this.preloadDropboxImages(), 0);
    }
  }
  private previousActiveElement: Element | null = null;
  // Default to the original CSV order by sorting on the numeric `index`.
  protected readonly sortColumn = signal<BladeSortColumn>('index');
  protected readonly sortDirection = signal<SortDirection>('asc');
  protected readonly aMin = signal('10');
  protected readonly aMax = signal('87');
  protected readonly bMin = signal('40');
  protected readonly bMax = signal('224');
  protected readonly rMin = signal('62');
  protected readonly rMax = signal('180');
  protected readonly pesoMin = signal('0.20');
  protected readonly pesoMax = signal('2.70');
  protected readonly foroValue = signal('');
  protected readonly modalOpen = signal(false);
  protected readonly modalImage = signal('');
  protected readonly modalCol = signal(0);
  protected readonly modalRow = signal(0);
  protected readonly modalX = signal(0);
  protected readonly modalY = signal(0);
  protected readonly modalLabel = signal('');
  protected readonly modalLoaded = signal(false);
  protected readonly modalLoadError = signal(false);
  protected readonly modalNaturalWidth = signal(0);
  protected readonly modalNaturalHeight = signal(0);
  protected readonly modalUseFallback = signal(false);
  protected readonly modalUseCanvas = signal(false);
  protected readonly modalArticolo = signal('');
  // Dynamic collections of signals for supported sets.
  protected readonly mazzeSetIds = SUPPORTED_DROPBOX_SET_IDS;
  protected readonly mazzeLinkDrafts = new Map<string, WritableSignal<string>>();
  protected readonly mazzeLinks = new Map<string, Signal<string>>();
  // Use `masterData` as the single source of truth for blades and coordinates.
  protected readonly blades: readonly BladeRecord[] = (masterData as Array<any>).map((c: any, i: number) => ({
    pageTag: c.pageTag || ((): string => {
      const m = /mazze-set-(\d+)\.png$/.exec(c.image || '');
      return m ? m[1] : String(Math.floor(i / 16));
    })(),
    articolo: c.articolo || `MZ-${i}`,
    aMm: c.aMm || '',
    bMm: c.bMm || '',
    foroOrAsola: c.foroOrAsola || '',
    rMm: c.rMm || '',
    pesoKg: c.pesoKg || '',
    applicazioni: c.applicazioni || '',
    index: i,
  }));

  // Build a lightweight coordinates view for lookup by index (used by openMazzaImage)
  private readonly coordinates = (masterData as Array<any>).map((c: any) => ({
    image: c.image || '',
    x: typeof c.x === 'number' ? c.x : 0,
    y: typeof c.y === 'number' ? c.y : 0,
  }));

  // Return only the file name portion of the modal image path (e.g. 'mazze-set-45.png')
  protected modalImageName(): string {
    const img = this.modalImage();
    if (!img) return '';
    const parts = img.split('/');
    return parts.length ? parts[parts.length - 1] : img;
  }

  protected readonly foroValues = computed(() => Array.from(
    new Set(this.blades.map((blade) => blade.foroOrAsola).filter((value) => value !== '' && Number.isFinite(Number(value)))),
  ).sort((left, right) => Number(left) - Number(right)));

  protected readonly filteredBlades = computed(() => this.blades.filter((blade) =>
    this.matchesRange(blade.aMm, this.aMin(), this.aMax()) &&
    this.matchesRange(blade.bMm, this.bMin(), this.bMax()) &&
    this.matchesRange(blade.rMm, this.rMin(), this.rMax()) &&
    this.matchesRange(blade.pesoKg, this.pesoMin(), this.pesoMax()) &&
    this.matchesForoValue(blade.foroOrAsola),
  ));

  protected readonly sortedBlades = computed(() => {
    const column = this.sortColumn();
    const direction = this.sortDirection();
    const multiplier = direction === 'asc' ? 1 : -1;

    return [...this.filteredBlades()].sort((left, right) => {
      const leftValue = left[column];
      const rightValue = right[column];

      const leftMissing = leftValue === null || leftValue === undefined || leftValue === '';
      const rightMissing = rightValue === null || rightValue === undefined || rightValue === '';
      if (leftMissing || rightMissing) {
        if (leftMissing && rightMissing) return 0;
        // Put missing values after present ones
        return leftMissing ? 1 : -1;
      }

      const leftNumber = Number(leftValue);
      const rightNumber = Number(rightValue);
      const areNumbers = Number.isFinite(leftNumber) && Number.isFinite(rightNumber);
      const comparison = areNumbers
        ? leftNumber - rightNumber
        : String(leftValue).localeCompare(String(rightValue), 'it', { numeric: true, sensitivity: 'base' });

      return comparison * multiplier;
    });
  });

  protected sortBy(column: BladeSortColumn): void {
    if (this.sortColumn() === column) {
      this.sortDirection.update((direction) => direction === 'asc' ? 'desc' : 'asc');
      return;
    }

    this.sortColumn.set(column);
    this.sortDirection.set('asc');
  }

  protected ariaSort(column: BladeSortColumn): 'ascending' | 'descending' | 'none' {
    if (this.sortColumn() !== column) {
      return 'none';
    }

    return this.sortDirection() === 'asc' ? 'ascending' : 'descending';
  }

  protected sortIndicator(column: BladeSortColumn): string {
    if (this.sortColumn() !== column) {
      return '↕';
    }

    return this.sortDirection() === 'asc' ? '↑' : '↓';
  }

  protected resetFilters(): void {
    this.aMin.set('10');
    this.aMax.set('87');
    this.bMin.set('40');
    this.bMax.set('224');
    this.rMin.set('62');
    this.rMax.set('180');
    this.pesoMin.set('0.20');
    this.pesoMax.set('2.70');
    this.foroValue.set('');
  }

  private matchesRange(value: string, minimum: string, maximum: string): boolean {
    // If the field is blank/unknown, include the record (don't exclude it by range filters).
    if (value === '' || value == null) {
      return true;
    }

    if (!minimum && !maximum) {
      return true;
    }

    const numericValue = Number(value);

    // If the value is not a finite number, treat it as unknown and include it.
    if (!Number.isFinite(numericValue)) {
      return true;
    }

    const numericMinimum = minimum === '' || minimum == null ? Number.NEGATIVE_INFINITY : Number(minimum);
    const numericMaximum = maximum === '' || maximum == null ? Number.POSITIVE_INFINITY : Number(maximum);

    return numericValue >= numericMinimum && numericValue <= numericMaximum;
  }

  private matchesForoValue(value: string): boolean {
    return !this.foroValue() || value === this.foroValue();
  }

  protected openMazzaImage(blade: BladeRecord): void {
    // Determine the absolute index of the blade within the master blades array.
    let index = this.blades.indexOf(blade);

    // If the blade isn't found (shouldn't happen), try to find it by articolo.
    if (index === -1) {
      index = this.blades.findIndex((b) => b.articolo && b.articolo === blade.articolo);
    }

    // Default to first image if still not found.
    if (index === -1) {
      index = 0;
    }

    const page = Math.floor(index / 16);
    const imagePath = this.resolveMazzeImageUrl(`/assets/images/mazze-set-${page}.png`);

    const indexWithinSet = index % 16;

    // Try to read pixel coordinates from the master coordinates.
    const coord = (this.coordinates as Array<{ image: string; x: number; y: number; }>)[index];

    if (coord) {
      this.modalImage.set(this.resolveMazzeImageUrl(coord.image || imagePath));
      this.modalX.set(coord.x || 0);
      this.modalY.set(coord.y || 0);
      this.modalLabel.set(`${blade.articolo || '—'} (${index})`);
      this.modalArticolo.set(blade.articolo || '');

      this.modalLoaded.set(false);
      this.modalLoadError.set(false);
      this.modalNaturalWidth.set(0);
      this.modalNaturalHeight.set(0);

      // Also compute col/row for legacy UI uses (if needed).
      const col = Math.round((coord.x || 0) / 444);
      const row = Math.round(((coord.y || 0) - 40) / 280);
      this.modalCol.set(Math.max(0, Math.min(3, col)));
      this.modalRow.set(Math.max(0, Math.min(3, row)));
    } else {
      this.modalLabel.set(`${blade.articolo || '—'} (${index})`);
      this.modalArticolo.set(blade.articolo || '');
      this.modalLoaded.set(false);
      this.modalLoadError.set(false);
      this.modalNaturalWidth.set(0);
      this.modalNaturalHeight.set(0);
      const col = indexWithinSet % 4; // 0..3
      const row = Math.floor(indexWithinSet / 4); // 0..3
      this.modalCol.set(col);
      this.modalRow.set(row);
      this.modalX.set(col * 444);
      this.modalY.set(row * 280 + 40);
      this.modalImage.set(imagePath);
    }
    // Start a lightweight preload probe to determine if the image is actually reachable
    // and to capture natural sizes reliably without depending on `NgOptimizedImage` events.
    const probeUrl = this.modalImage();
    const probe = new Image();
    probe.decoding = 'async';
    probe.onload = () => {
      console.debug('[ricerca-mazze] probe.onload', probe.src, probe.naturalWidth, probe.naturalHeight);
      this.modalNaturalWidth.set(probe.naturalWidth || 0);
      this.modalNaturalHeight.set(probe.naturalHeight || 0);
      this.modalLoaded.set(true);
      this.modalLoadError.set(false);
      // Use the native `src` attribute path in the template to avoid any optimized-loader
      // edge-cases that may suppress load events in the rendered <img> element.
      this.modalUseFallback.set(true);
    };
    probe.onerror = () => {
      console.debug('[ricerca-mazze] probe.onerror', probe.src);
      this.modalLoaded.set(false);
      this.modalLoadError.set(true);
      this.modalNaturalWidth.set(0);
      this.modalNaturalHeight.set(0);
      // Fallback to native `src` and let the DOM image attempt again.
      this.modalUseFallback.set(true);
    };
    // Trigger the probe async load.
    probe.src = probeUrl;

    // Save currently focused element so we can restore focus on close.
    this.previousActiveElement = document.activeElement as Element | null;
    this.modalOpen.set(true);
    // Focus the modal overlay so it receives keyboard events (Escape).
    setTimeout(() => {
      const overlay = document.querySelector('.ricerca-mazze-modal') as HTMLElement | null;
      if (overlay) overlay.focus();
    }, 0);
    this.checkModalAttempts = 0;
    setTimeout(this.checkModalImageReady, 100);
  }

  protected closeMazzaImage(): void {
    this.modalOpen.set(false);
    this.modalImage.set('');
    this.modalArticolo.set('');
    // Restore previous focus when modal closes.
    try {
      if (this.previousActiveElement instanceof HTMLElement) {
        (this.previousActiveElement as HTMLElement).focus();
      }
    } catch (e) {
      // ignore
    }
  }

  protected onModalImageLoad(event: Event): void {
    const img = event.target as HTMLImageElement;
    const natW = img.naturalWidth || 0;
    const natH = img.naturalHeight || 0;
    console.debug('[ricerca-mazze] onModalImageLoad', img.src, img.complete, natW, natH);
    this.modalLoaded.set(true);
    this.modalLoadError.set(false);
    this.modalNaturalWidth.set(natW);
    this.modalNaturalHeight.set(natH);

    // Clamp modalX/modalY so the 444x280 viewport stays inside the image bounds.
    const maxX = Math.max(0, natW - 444);
    const maxY = Math.max(0, natH - 280);
    const curX = this.modalX();
    const curY = this.modalY();
    const clampedX = Math.max(0, Math.min(maxX, curX));
    const clampedY = Math.max(0, Math.min(maxY, curY));
    if (clampedX !== curX) this.modalX.set(clampedX);
    if (clampedY !== curY) this.modalY.set(clampedY);
    this.modalUseFallback.set(false);
    // If we successfully loaded via <img>, ensure canvas fallback is off
    this.modalUseCanvas.set(false);
    // Ensure the rendered <img> uses the image's natural pixel size so our
    // translation coordinates (which are in natural pixels) align correctly.
    try {
      img.style.width = natW + 'px';
      img.style.height = natH + 'px';
      img.style.maxWidth = 'none';
      img.style.maxHeight = 'none';
      img.style.objectFit = 'none';
    } catch (e) {
      console.debug('[ricerca-mazze] failed to set img inline styles', e);
    }
    // If canvas was active, turn it off because the <img> rendered successfully.
    this.modalUseCanvas.set(false);
  }

  protected onModalImageError(): void {
    console.debug('[ricerca-mazze] onModalImageError', this.modalImage());
    this.modalLoaded.set(false);
    this.modalLoadError.set(true);
    this.modalNaturalWidth.set(0);
    this.modalNaturalHeight.set(0);
    this.modalUseFallback.set(true);
    // try canvas fallback automatically when image element reports error
    this.modalUseCanvas.set(true);
    setTimeout(() => this.renderCanvasCrop(), 60);
  }

  protected toggleCanvasView(): void {
    this.modalUseCanvas.update((v) => !v);
    if (this.modalUseCanvas()) {
      // render immediately
      setTimeout(() => this.renderCanvasCrop(), 50);
    }
  }

  protected renderCanvasCrop(): void {
    const canvas = document.querySelector('.tile-canvas') as HTMLCanvasElement | null;
    if (!canvas) {
      console.debug('[ricerca-mazze] renderCanvasCrop: canvas not found');
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const sx = Math.max(0, Math.floor(this.modalX()));
      const sy = Math.max(0, Math.floor(this.modalY()));
      const sw = 444;
      const sh = 280;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      try {
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
        console.debug('[ricerca-mazze] renderCanvasCrop: drawn', img.src, sx, sy, sw, sh);
      } catch (err) {
        console.debug('[ricerca-mazze] renderCanvasCrop error', err);
      }
    };
    img.onerror = () => console.debug('[ricerca-mazze] renderCanvasCrop: image load error', this.modalImage());
    img.src = this.modalImage();
  }

  // Some browsers or the NgOptimizedImage behavior can prevent the native load event
  // from firing in certain circumstances. As a fallback we poll the DOM for the
  // rendered image and check its `naturalWidth` to decide whether it loaded.
  private checkModalAttempts = 0;
  private readonly maxModalChecks = 12;
  private checkModalImageReady = (): void => {
    this.checkModalAttempts += 1;
    const el = document.querySelector('.tile-img') as HTMLImageElement | null;
    if (el) {
      console.debug('[ricerca-mazze] checkModalImageReady found el', el.src, 'complete=', el.complete, 'nat=', el.naturalWidth, el.naturalHeight);
      const natW = el.naturalWidth || 0;
      const natH = el.naturalHeight || 0;
      if (natW > 0 || natH > 0) {
        // treat as loaded
        this.modalLoaded.set(true);
        this.modalLoadError.set(false);
        this.modalNaturalWidth.set(natW);
        this.modalNaturalHeight.set(natH);

        // clamp offsets now that we know sizes
        const maxX = Math.max(0, natW - 444);
        const maxY = Math.max(0, natH - 280);
        const curX = this.modalX();
        const curY = this.modalY();
        const clampedX = Math.max(0, Math.min(maxX, curX));
        const clampedY = Math.max(0, Math.min(maxY, curY));
        if (clampedX !== curX) this.modalX.set(clampedX);
        if (clampedY !== curY) this.modalY.set(clampedY);
        return;
      }

      if (el.complete && natW === 0 && natH === 0) {
        // image load finished but no pixels -> error
        this.modalLoaded.set(false);
        this.modalLoadError.set(true);
        return;
      }
    }

    if (this.checkModalAttempts < this.maxModalChecks && this.modalOpen()) {
      setTimeout(this.checkModalImageReady, 200);
      return;
    }

    // give up
    if (!this.modalLoaded()) {
      this.modalLoadError.set(true);
      // switch to canvas fallback automatically when polling gives up
      this.modalUseCanvas.set(true);
      setTimeout(() => this.renderCanvasCrop(), 60);
    }
  };

  protected onMazzeLinkInput(setNumber: string | number, value: string): void {
    const id = String(setNumber);
    const draft = this.mazzeLinkDrafts.get(id);
    if (draft) draft.set(value);
  }

  protected saveMazzeLink(setNumber: string | number): void {
    const id = String(setNumber);
    const key = `scan-mulcher-mazze-${id}-link`;
    const draft = this.mazzeLinkDrafts.get(id);
    const value = draft ? draft() : '';
    const normalized = value.trim();

    if (isPlatformBrowser(this.platformId)) {
      if (normalized) {
        window.localStorage.setItem(key, normalized);
      } else {
        window.localStorage.removeItem(key);
      }
    }

    if (draft) draft.set(normalized);
  }

  protected clearMazzeLink(setNumber: string | number): void {
    const id = String(setNumber);
    const key = `scan-mulcher-mazze-${id}-link`;
    if (isPlatformBrowser(this.platformId)) {
      window.localStorage.removeItem(key);
    }
    const draft = this.mazzeLinkDrafts.get(id);
    if (draft) draft.set('');
  }

  // Helper for templates to read the current draft value for a given set id.
  protected mazzeLinkDraftValue(id: string): string {
    const d = this.mazzeLinkDrafts.get(String(id));
    return d ? d() : '';
  }

  // Indicates whether the "Cancella" button should be enabled for a set id.
  // Returns true when there is a saved value in localStorage for the key,
  // or when the current draft differs from the known default (i.e. user-entered).
  protected canClearMazzeLink(id: string): boolean {
    const key = `scan-mulcher-mazze-${id}-link`;
    if (isPlatformBrowser(this.platformId)) {
      const stored = window.localStorage.getItem(key);
      if (stored !== null && stored.trim().length > 0) return true;
    }

    const draft = this.mazzeLinkDrafts.get(String(id));
    if (!draft) return false;

    const current = draft().trim();
    const defaultVal = DEFAULT_DROPBOX_LINKS[id as keyof typeof DEFAULT_DROPBOX_LINKS] ?? '';
    // If current draft is non-empty and differs from the default placeholder, allow clearing.
    return current.length > 0 && current !== defaultVal;
  }

  // Cache of preloaded Image objects by set id.
  protected readonly preloadedImages = new Map<string, HTMLImageElement>();

  // Preload all configured Dropbox images so they are available when the user opens a modal.
  private preloadDropboxImages(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    for (const id of this.mazzeSetIds) {
      const comp = this.mazzeLinks.get(id);
      if (!comp) continue;
      const url = comp();
      if (!url) continue;

      // If already preloaded, skip
      if (this.preloadedImages.has(id)) continue;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.decoding = 'async';
      img.onload = () => console.debug('[ricerca-mazze] preloaded', id, url, img.naturalWidth, img.naturalHeight);
      img.onerror = (e) => console.debug('[ricerca-mazze] preload error', id, url, e);
      // Trigger load
      img.src = url;
      this.preloadedImages.set(id, img);
    }
  }

  // If the URL points to Dropbox, route it through the local proxy so the browser
  // can load it without CORS failures. In non-browser contexts, return the original URL.
  private maybeProxyDropbox(url: string): string {
    if (!url) return url;
    if (!isPlatformBrowser(this.platformId)) return url;

    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes('dropbox.com')) {
        return `/_image_proxy?u=${encodeURIComponent(url)}`;
      }
    } catch {
      // ignore malformed URLs
    }

    return url;
  }

  private readMazzeLink(key: string, defaultValue: string): string {
    if (!isPlatformBrowser(this.platformId)) {
      return defaultValue;
    }

    return window.localStorage.getItem(key) ?? defaultValue;
  }

  private resolveMazzeImageUrl(localPath: string): string {
    const match = /mazze-set-([0-9]+a?)\.png$/i.exec(localPath);
    if (!match) return localPath;

    const id = match[1];
    const computedLink = this.mazzeLinks.get(id);
    if (computedLink) {
      return (computedLink() as string) || localPath;
    }

    return localPath;
  }

}
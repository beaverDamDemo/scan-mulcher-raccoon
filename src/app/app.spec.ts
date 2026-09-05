import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { App } from './app';
import { ScanRecord } from './models/scan-record';
import { OcrResult } from './services/ocr.service';
import { STORAGE_PROVIDER, StorageProvider } from './services/storage-provider';

class StorageProviderStub implements StorageProvider {
  readonly name = 'Dropbox';

  isConfigured(): boolean {
    return false;
  }

  async saveScan(): Promise<never> {
    throw new Error('Not implemented in this test.');
  }
}

interface ScanRecordBuilder {
  curateOcrResult(result: OcrResult): OcrResult;
  buildRecord(source: ScanRecord['source'], capturedAt: string, result: OcrResult): ScanRecord;
}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        {
          provide: STORAGE_PROVIDER,
          useClass: StorageProviderStub,
        },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the scanner heading', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-page-header h1')?.textContent).toContain('Scan Mulcher Goblin');
    expect(compiled.querySelector('app-page-header [aria-label="Torna allo scanner"]')).toBeNull();
    expect(compiled.querySelector('app-page-header img[alt="Scan Mulcher logo"]')).toBeTruthy();
    expect(compiled.querySelector('app-page-header [aria-label="Vai alla pagina principale"]')?.getAttribute('href')).toBe('/');
    expect(compiled.querySelectorAll('app-page-header nav a')).toHaveLength(3);
    expect(compiled.querySelector('app-page-header [aria-controls="primary-navigation"]')).toBeTruthy();
    expect(compiled.querySelector('h2')?.textContent).toContain('Browser-first label scanning');
  });

  it('should open the header navigation menu', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const menuButton = compiled.querySelector<HTMLButtonElement>('[aria-controls="primary-navigation"]');
    const navigation = compiled.querySelector<HTMLElement>('#primary-navigation');

    menuButton?.click();
    fixture.detectChanges();

    expect(menuButton?.getAttribute('aria-expanded')).toBe('true');
    expect(navigation?.classList.contains('page-header__nav--open')).toBe(true);
  });

  it('should retain label content and expose dotted item IDs and prices', () => {
    const fixture = TestBed.createComponent(App);
    const recordBuilder = fixture.componentInstance as unknown as ScanRecordBuilder;
    const result = recordBuilder.curateOcrResult({
      confidence: 90,
      lines: [],
      numbers: [],
      rawText: 'Special offer\n2.4119.134.0\n€ 18.50\nShelf B3\nAgri Store Parts Sezana',
    });
    const record = recordBuilder.buildRecord('upload', '2026-09-05T12:00:00.000Z', result);

    expect(record.lines).toEqual(['Special offer', '2.4119.134.0', '€ 18.50', 'Shelf B3']);
    expect(record.itemId).toBe('2.4119.134.0');
    expect(record.price).toBe('€ 18.50');
  });
});

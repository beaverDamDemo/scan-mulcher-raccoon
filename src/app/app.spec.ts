import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { App } from './app';
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
});

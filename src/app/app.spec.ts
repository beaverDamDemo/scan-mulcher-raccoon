import { TestBed } from '@angular/core/testing';

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
    expect(compiled.querySelector('h1')?.textContent).toContain('Browser-first label scanning');
    expect(compiled.textContent).toContain('Scanner workbench');
  });
});

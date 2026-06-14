import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';

const DROPBOX_ACCESS_TOKEN_STORAGE_KEY = 'scan-mulcher-dropbox-access-token';

@Injectable({ providedIn: 'root' })
export class DropboxTokenStoreService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly token = signal(this.readToken());

  readonly tokenValue = computed(() => this.token());
  readonly hasToken = computed(() => this.tokenValue().trim().length > 0);

  getToken(): string {
    return this.tokenValue().trim();
  }

  setToken(token: string): void {
    const normalizedToken = token.trim();

    this.token.set(normalizedToken);

    if (isPlatformBrowser(this.platformId)) {
      window.localStorage.setItem(DROPBOX_ACCESS_TOKEN_STORAGE_KEY, normalizedToken);
    }
  }

  clearToken(): void {
    this.token.set('');

    if (isPlatformBrowser(this.platformId)) {
      window.localStorage.removeItem(DROPBOX_ACCESS_TOKEN_STORAGE_KEY);
    }
  }

  private readToken(): string {
    if (!isPlatformBrowser(this.platformId)) {
      return '';
    }

    return window.localStorage.getItem(DROPBOX_ACCESS_TOKEN_STORAGE_KEY) ?? '';
  }
}
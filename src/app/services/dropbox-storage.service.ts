import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

import {
  DROPBOX_STORAGE_CONFIG,
  SavedScanRecord,
  SaveScanPayload,
  StorageProvider,
} from './storage-provider';
import { DropboxTokenStoreService } from './dropbox-token-store.service';

@Injectable({ providedIn: 'root' })
export class DropboxStorageService implements StorageProvider {
  readonly name = 'Dropbox';

  private readonly config = inject(DROPBOX_STORAGE_CONFIG);
  private readonly tokenStore = inject(DropboxTokenStoreService);
  private readonly platformId = inject(PLATFORM_ID);

  isConfigured(): boolean {
    return this.tokenStore.hasToken();
  }

  async saveScan(payload: SaveScanPayload): Promise<SavedScanRecord> {
    if (!isPlatformBrowser(this.platformId)) {
      throw new Error('Dropbox uploads are only available in the browser.');
    }

    if (!this.isConfigured()) {
      throw new Error('Add a Dropbox access token in the settings panel to enable cloud saves.');
    }

    const folderPath = this.normalizeFolderPath(this.config.targetFolder);
    const imagePath = `${folderPath}/${payload.fileStem}.jpg`;
    const resultPath = `${folderPath}/${payload.fileStem}.json`;
    const resultBlob = new Blob([JSON.stringify(payload.result, null, 2)], {
      type: 'application/json',
    });

    await Promise.all([
      this.uploadFile(imagePath, payload.image),
      this.uploadFile(resultPath, resultBlob),
    ]);

    return {
      provider: this.name,
      folderPath,
      imagePath,
      resultPath,
      savedAt: new Date().toISOString(),
    };
  }

  private normalizeFolderPath(folderPath: string): string {
    const trimmedPath = folderPath.trim().replace(/\/+$/, '');

    if (!trimmedPath) {
      return '/scan-mulcher-goblin';
    }

    return trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`;
  }

  private async uploadFile(path: string, body: Blob): Promise<void> {
    const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.tokenStore.getToken()}`,
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify({
          autorename: true,
          mode: 'add',
          mute: false,
          path,
          strict_conflict: false,
        }),
      },
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Dropbox upload failed (${response.status}): ${errorText}`);
    }
  }
}
import { InjectionToken } from '@angular/core';

import { ScanRecord } from '../models/scan-record';

export interface SaveScanPayload {
  fileStem: string;
  image: Blob;
  result: ScanRecord;
}

export interface SavedScanRecord {
  provider: string;
  folderPath: string;
  imagePath: string;
  resultPath: string;
  savedAt: string;
}

export interface StorageProvider {
  readonly name: string;
  isConfigured(): boolean;
  saveScan(payload: SaveScanPayload): Promise<SavedScanRecord>;
}

export interface DropboxStorageConfig {
  targetFolder: string;
}

export const STORAGE_PROVIDER = new InjectionToken<StorageProvider>('STORAGE_PROVIDER');

export const DROPBOX_STORAGE_CONFIG = new InjectionToken<DropboxStorageConfig>(
  'DROPBOX_STORAGE_CONFIG',
  {
    factory: () => ({
      targetFolder: '/scan-mulcher-goblin',
    }),
  },
);
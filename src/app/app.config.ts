import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { DropboxStorageService } from './services/dropbox-storage.service';
import { DROPBOX_STORAGE_CONFIG, STORAGE_PROVIDER } from './services/storage-provider';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(),
    {
      provide: DROPBOX_STORAGE_CONFIG,
      useValue: {
        targetFolder: '/scan-mulcher-goblin',
      },
    },
    {
      provide: STORAGE_PROVIDER,
      useExisting: DropboxStorageService,
    },
  ]
};

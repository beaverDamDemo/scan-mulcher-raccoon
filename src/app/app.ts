import { isPlatformBrowser } from '@angular/common';
import { NgOptimizedImage } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';

import { ScanRecord } from './models/scan-record';
import { OcrResult, OcrService } from './services/ocr.service';
import { DropboxTokenStoreService } from './services/dropbox-token-store.service';
import { STORAGE_PROVIDER, SavedScanRecord } from './services/storage-provider';

type ScanState =
  | 'idle'
  | 'starting-camera'
  | 'camera-ready'
  | 'recognizing'
  | 'ready-to-save'
  | 'saving'
  | 'saved'
  | 'error';

interface ScanSession {
  fileStem: string;
  image: Blob;
  previewUrl: string;
  result: ScanRecord;
}

@Component({
  selector: 'app-root',
  imports: [NgOptimizedImage],
  host: {
    class: 'block min-h-screen',
  },
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly destroyRef = inject(DestroyRef);
  private readonly ocrService = inject(OcrService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly storageProvider = inject(STORAGE_PROVIDER);
  private readonly tokenStore = inject(DropboxTokenStoreService);

  private mediaStream: MediaStream | null = null;
  private previewUrl: string | null = null;

  protected readonly videoElement = viewChild<ElementRef<HTMLVideoElement>>('videoElement');
  protected readonly title = 'Scan Mulcher Goblin';
  protected readonly isBrowser = isPlatformBrowser(this.platformId);
  protected readonly dropboxTokenDraft = signal(this.tokenStore.getToken());
  protected readonly state = signal<ScanState>('idle');
  protected readonly errorMessage = signal('');
  protected readonly savedRecord = signal<SavedScanRecord | null>(null);
  protected readonly session = signal<ScanSession | null>(null);
  protected readonly settingsOpen = signal(!this.tokenStore.hasToken());
  protected readonly storageName = this.storageProvider.name;
  protected readonly cameraSupported =
    this.isBrowser && typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
  protected readonly busy = computed(() => ['starting-camera', 'recognizing', 'saving'].includes(this.state()));
  protected readonly previewImageUrl = computed(() => this.session()?.previewUrl ?? '');
  protected readonly storageConfigured = computed(() => this.storageProvider.isConfigured());
  protected readonly dropboxConfigured = computed(() => this.tokenStore.hasToken());
  protected readonly canSave = computed(() => !!this.session() && this.storageConfigured() && !this.busy());
  protected readonly tokenDraftEmpty = computed(() => this.dropboxTokenDraft().trim().length === 0);
  protected readonly dropboxTokenStatus = computed(() =>
    this.dropboxConfigured() ? 'Stored locally' : 'No token saved',
  );
  protected readonly statusMessage = computed(() => {
    switch (this.state()) {
      case 'starting-camera':
        return 'Requesting camera access';
      case 'camera-ready':
        return 'Camera ready for capture';
      case 'recognizing':
        return 'Reading the label';
      case 'ready-to-save':
        return 'OCR complete';
      case 'saving':
        return `Saving to ${this.storageName}`;
      case 'saved':
        return 'Result saved';
      case 'error':
        return 'Action required';
      default:
        return 'Ready to scan';
    }
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.stopCamera();
      this.revokePreviewUrl();
    });
  }

  protected async startCamera(): Promise<void> {
    if (!this.cameraSupported) {
      this.handleError('Camera capture is not available in this browser.');
      return;
    }

    this.errorMessage.set('');
    this.savedRecord.set(null);
    this.state.set('starting-camera');

    try {
      this.stopCamera();

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
        },
      });

      const video = this.videoElement()?.nativeElement;

      if (!video) {
        throw new Error('Camera preview is not ready yet.');
      }

      video.srcObject = this.mediaStream;
      await video.play();
      this.state.set('camera-ready');
    } catch (error: unknown) {
      this.stopCamera();
      this.handleError('Could not start the camera.', error);
    }
  }

  protected stopCamera(): void {
    const hadActiveStream = !!this.mediaStream;

    this.mediaStream?.getTracks().forEach((track) => track.stop());
    this.mediaStream = null;

    const video = this.videoElement()?.nativeElement;

    if (hadActiveStream && video && typeof video.pause === 'function') {
      video.pause();
    }

    if (hadActiveStream && video && 'srcObject' in video) {
      video.srcObject = null;
    }

    if (this.state() === 'camera-ready') {
      this.state.set(this.session() ? 'ready-to-save' : 'idle');
    }
  }

  protected async captureFrame(): Promise<void> {
    const video = this.videoElement()?.nativeElement;

    if (!this.isBrowser || !video || !this.mediaStream) {
      this.handleError('Start the camera before capturing a frame.');
      return;
    }

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      this.handleError('The camera stream is not ready yet.');
      return;
    }

    this.state.set('recognizing');
    this.errorMessage.set('');

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Unable to capture the current frame.');
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const image = await this.canvasToBlob(canvas);
      const capturedAt = new Date().toISOString();
      await this.processImage(image, 'camera', capturedAt, this.createObjectUrl(image));
      this.stopCamera();
    } catch (error: unknown) {
      this.handleError('Could not process OCR from the captured frame.', error);
    }
  }

  protected async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;

    if (!file) {
      return;
    }

    this.state.set('recognizing');
    this.errorMessage.set('');
    this.savedRecord.set(null);

    try {
      const capturedAt = new Date().toISOString();
      await this.processImage(file, 'upload', capturedAt, this.createObjectUrl(file));
    } catch (error: unknown) {
      this.handleError('Could not process OCR from the selected image.', error);
    } finally {
      if (input) {
        input.value = '';
      }
    }
  }

  protected async saveScan(): Promise<void> {
    const activeSession = this.session();

    if (!activeSession) {
      this.handleError('Capture or upload an image before saving.');
      return;
    }

    if (!this.storageProvider.isConfigured()) {
      this.handleError('Add a Dropbox access token in the settings panel to enable saving.');
      return;
    }

    this.state.set('saving');
    this.errorMessage.set('');

    try {
      const savedRecord = await this.storageProvider.saveScan({
        fileStem: activeSession.fileStem,
        image: activeSession.image,
        result: activeSession.result,
      });

      this.savedRecord.set(savedRecord);
      this.state.set('saved');
    } catch (error: unknown) {
      this.handleError('Saving the scan failed.', error);
    }
  }

  protected clearSession(): void {
    this.stopCamera();
    this.revokePreviewUrl();
    this.session.set(null);
    this.savedRecord.set(null);
    this.errorMessage.set('');
    this.state.set('idle');
  }

  protected formatConfidence(confidence: number): string {
    return `${Math.round(confidence)}%`;
  }

  protected onDropboxTokenInput(value: string): void {
    this.dropboxTokenDraft.set(value);
  }

  protected saveDropboxToken(): void {
    this.tokenStore.setToken(this.dropboxTokenDraft());
    this.dropboxTokenDraft.set(this.tokenStore.getToken());

    if (this.tokenStore.hasToken()) {
      this.settingsOpen.set(false);
    }
  }

  protected clearDropboxToken(): void {
    this.tokenStore.clearToken();
    this.dropboxTokenDraft.set('');
    this.settingsOpen.set(true);
  }

  protected toggleSettingsOpen(): void {
    this.settingsOpen.update((isOpen) => !isOpen);
  }

  private async processImage(
    image: Blob,
    source: ScanRecord['source'],
    capturedAt: string,
    previewUrl: string,
  ): Promise<void> {
    const ocrResult = await this.ocrService.recognize(image);
    const curatedOcrResult = this.curateOcrResult(ocrResult);
    const record = this.buildRecord(source, capturedAt, curatedOcrResult);

    this.setSession({
      fileStem: this.buildFileStem(source, capturedAt),
      image,
      previewUrl,
      result: record,
    });

    this.state.set('ready-to-save');
  }

  private buildRecord(
    source: ScanRecord['source'],
    capturedAt: string,
    ocrResult: OcrResult,
  ): ScanRecord {
    return {
      capturedAt,
      confidence: ocrResult.confidence,
      lines: ocrResult.lines,
      numbers: ocrResult.numbers,
      rawText: ocrResult.rawText,
      source,
    };
  }

  private curateOcrResult(ocrResult: OcrResult): OcrResult {
    const cleanedLines = ocrResult.rawText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .filter((line) => !this.isFooterLine(line));

    if (cleanedLines.length === 0) {
      return {
        ...ocrResult,
        lines: [],
        numbers: [],
        rawText: '',
      };
    }

    const lokacijaIndex = cleanedLines.findIndex((line) => /^lokacija\b/i.test(line));
    const lokacijaLine = lokacijaIndex >= 0 ? cleanedLines[lokacijaIndex] : '';

    const candidateLines = cleanedLines.filter((line) => line !== lokacijaLine);
    const numberIndex = candidateLines.findIndex((line) => this.isItemNumberLine(line));
    const itemNumberLine = numberIndex >= 0 ? candidateLines[numberIndex] : '';

    let itemNameLine = '';

    if (numberIndex > 0) {
      itemNameLine = candidateLines[numberIndex - 1];
    } else {
      itemNameLine = candidateLines.find((line) => !this.isPriceLine(line) && !this.isItemNumberLine(line)) ?? '';
    }

    const itemPriceLine = candidateLines.find(
      (line) => line !== itemNameLine && line !== itemNumberLine && this.isPriceLine(line),
    ) ?? '';

    const curatedLines = [itemNameLine, itemNumberLine, itemPriceLine, lokacijaLine]
      .map((line) => line.trim())
      .filter((line, index, array) => line.length > 0 && array.indexOf(line) === index);

    const fallbackLines = cleanedLines.slice(0, 4);
    const finalLines = curatedLines.length > 0 ? curatedLines : fallbackLines;
    const finalRawText = finalLines.join('\n');
    const finalNumbers = Array.from(
      new Set(Array.from(finalRawText.matchAll(/\d+(?:[.,:/-]\d+)*/g), ([value]) => value)),
    );

    return {
      confidence: ocrResult.confidence,
      lines: finalLines,
      numbers: finalNumbers,
      rawText: finalRawText,
    };
  }

  private isFooterLine(line: string): boolean {
    const normalized = line.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

    return normalized.includes('agri store parts sezana');
  }

  private isPriceLine(line: string): boolean {
    return /(€|\beur\b|\d+[.,]\d{2})/i.test(line);
  }

  private isItemNumberLine(line: string): boolean {
    const compact = line.replace(/\s+/g, '');

    if (compact.length < 3 || compact.length > 24) {
      return false;
    }

    if (this.isPriceLine(line)) {
      return false;
    }

    return /^[0-9][0-9A-Z/-]*$/.test(compact) && /\d/.test(compact);
  }

  private buildFileStem(source: ScanRecord['source'], capturedAt: string): string {
    return `scan-${source}-${capturedAt.replace(/[:.]/g, '-').replace('T', '-')}`;
  }

  private setSession(session: ScanSession): void {
    this.revokePreviewUrl();
    this.previewUrl = session.previewUrl;
    this.session.set(session);
  }

  private revokePreviewUrl(): void {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
      this.previewUrl = null;
    }
  }

  private createObjectUrl(image: Blob): string {
    if (!this.isBrowser) {
      return '';
    }

    return URL.createObjectURL(image);
  }

  private handleError(message: string, error?: unknown): void {
    const suffix = error instanceof Error ? ` ${error.message}` : '';

    this.errorMessage.set(`${message}${suffix}`.trim());
    this.state.set('error');
  }

  private canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error('The captured image could not be converted into a file.'));
      }, 'image/jpeg', 0.92);
    });
  }
}

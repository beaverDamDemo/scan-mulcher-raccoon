import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

export interface OcrResult {
  confidence: number;
  lines: string[];
  numbers: string[];
  rawText: string;
}

@Injectable({ providedIn: 'root' })
export class OcrService {
  private readonly platformId = inject(PLATFORM_ID);

  async recognize(image: Blob): Promise<OcrResult> {
    if (!isPlatformBrowser(this.platformId)) {
      throw new Error('OCR is only available in the browser.');
    }

    const tesseract = await import('tesseract.js');

    // tesseract.js can export different shapes depending on bundler/version.
    // Try a few strategies so the app works in both dev and production builds.
    let data: any;

    const maybeRecognize = (tesseract as any).recognize ?? (tesseract as any).default?.recognize;

    if (typeof maybeRecognize === 'function') {
      const { data: d } = await maybeRecognize(image, 'eng', { logger: () => undefined });
      data = d;
    } else if (typeof (tesseract as any).createWorker === 'function') {
      const { createWorker } = tesseract as any;
      const worker = createWorker({ logger: () => undefined });

      await worker.load();
      await worker.loadLanguage('eng');
      await worker.initialize('eng');

      const { data: d } = await worker.recognize(image);
      data = d;

      await worker.terminate();
    } else {
      throw new Error('Unsupported tesseract.js module shape');
    }

    const rawText = (data?.text ?? '').trim();
    const lines = rawText
      .split(/\r?\n/)
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0);
    const numbers = Array.from(
      new Set(Array.from(rawText.matchAll(/\d+(?:[.,:/-]\d+)*/g), ([value]) => value)),
    );

    return {
      confidence: data.confidence,
      lines,
      numbers,
      rawText,
    };
  }
}
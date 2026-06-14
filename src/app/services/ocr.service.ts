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

    const { recognize } = await import('tesseract.js');
    const { data } = await recognize(image, 'eng', {
      logger: () => undefined,
    });

    const rawText = data.text.trim();
    const lines = rawText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
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
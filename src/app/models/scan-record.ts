export interface ScanRecord {
  capturedAt: string;
  source: 'camera' | 'upload';
  rawText: string;
  lines: string[];
  numbers: string[];
  itemId: string | null;
  price: string | null;
  confidence: number;
}
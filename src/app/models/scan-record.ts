export interface ScanRecord {
  capturedAt: string;
  source: 'camera' | 'upload';
  rawText: string;
  lines: string[];
  numbers: string[];
  confidence: number;
}
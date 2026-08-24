import { Component } from '@angular/core';

import vehicles from './vehicles.json';

export interface Tractor {
  readonly id: number;
  readonly brand: string;
  readonly model: string;
  readonly years: string;
  readonly image: string;
  readonly facts: readonly string[];
}

@Component({
  selector: 'app-recognize-the-tractor',
  templateUrl: './recognize-the-tractor.html',
  styleUrl: './recognize-the-tractor.css',
})
export class RecognizeTheTractor {
  readonly tractors: readonly Tractor[] = vehicles;
}

import { Component } from '@angular/core';

import { PageHeader } from '../../components/page-header/page-header';
import vehicles from './vehicles.json';

export interface Tractor {
  readonly id: number;
  readonly brand: string;
  readonly model: string;
  readonly years: string;
  readonly image: string;
}

@Component({
  selector: 'app-recognize-the-tractor',
  imports: [PageHeader],
  templateUrl: './recognize-the-tractor.html',
  styleUrl: './recognize-the-tractor.css',
})
export class RecognizeTheTractor {
  readonly tractors: readonly Tractor[] = vehicles;
}

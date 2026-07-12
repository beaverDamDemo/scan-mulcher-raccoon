import { NgOptimizedImage } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface BladeRecord {
  pageTag: string;
  articolo: string;
  aMm: string;
  bMm: string;
  foroOrAsola: string;
  rMm: string;
  pesoKg: string;
  applicazioni: string;
}

type BladeSortColumn = keyof BladeRecord;
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-ricerca-mazze',
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './ricerca-mazze.html',
  styleUrl: './ricerca-mazze.css',
})
export class RicercaMazze {
  protected readonly sortColumn = signal<BladeSortColumn>('articolo');
  protected readonly sortDirection = signal<SortDirection>('asc');
  protected readonly aMin = signal('10');
  protected readonly aMax = signal('87');
  protected readonly bMin = signal('40');
  protected readonly bMax = signal('224');
  protected readonly rMin = signal('62');
  protected readonly rMax = signal('180');
  protected readonly pesoMin = signal('0.20');
  protected readonly pesoMax = signal('2.70');
  protected readonly foroValue = signal('');
  protected readonly modalOpen = signal(false);
  protected readonly modalImage = signal('');
  protected readonly blades: readonly BladeRecord[] = [
    { pageTag: '48/03', articolo: '56194', aMm: '60', bMm: '70', foroOrAsola: '30.5', rMm: '80', pesoKg: '1.50', applicazioni: 'SEPPI; FAE; BERTI; ORSI; AGRIMASTER; PICURSA' },
    { pageTag: '48/03', articolo: '56808', aMm: '60', bMm: '70', foroOrAsola: '31', rMm: '78', pesoKg: '1.53', applicazioni: 'SEPPI' },
    { pageTag: '48/03', articolo: '57591', aMm: '80', bMm: '70', foroOrAsola: '31', rMm: '85', pesoKg: '1.90', applicazioni: 'BERTI Forestale' },
    { pageTag: '48/03', articolo: '57461', aMm: '39', bMm: '100', foroOrAsola: '14.5', rMm: '103', pesoKg: '0.70', applicazioni: 'AGRIMASTER' },
    { pageTag: '48/03', articolo: '57462', aMm: '39', bMm: '100', foroOrAsola: '16.5', rMm: '103', pesoKg: '0.70', applicazioni: 'AGRIMASTER' },
    { pageTag: '48/03', articolo: '56599', aMm: '39', bMm: '100', foroOrAsola: '20.5', rMm: '103', pesoKg: '0.70', applicazioni: '' },
    { pageTag: '48/03', articolo: '56600', aMm: '30', bMm: '120', foroOrAsola: '25.5', rMm: '120', pesoKg: '0.88', applicazioni: 'AGRIMASTER' },
    { pageTag: '48/03', articolo: '57466', aMm: '40', bMm: '95', foroOrAsola: '12.5', rMm: '95', pesoKg: '0.62', applicazioni: 'SICMA; FERRI (OEM 0901194); AGRICOM; PERUZZO' },
    { pageTag: '48/03', articolo: '56802', aMm: '40', bMm: '95', foroOrAsola: '16.5', rMm: '95', pesoKg: '0.62', applicazioni: '' },
    { pageTag: '48/03', articolo: '56189', aMm: '40', bMm: '85', foroOrAsola: '14.5', rMm: '95', pesoKg: '0.70', applicazioni: 'AGRIMASTER (71009); AGROMEC (300.10.95); ORSI; SICMA; ZANON; DEL MORINO' },
    { pageTag: '48/03', articolo: '56190', aMm: '40', bMm: '85', foroOrAsola: '16.5', rMm: '95', pesoKg: '0.70', applicazioni: 'AGRIMASTER; MASCHIO 07400950R; UBALDI; ACMA; AGRICOM; ORTOLAN; PICURSA' },
    { pageTag: '48/03', articolo: '57617', aMm: '40', bMm: '85', foroOrAsola: '20.5', rMm: '95', pesoKg: '0.70', applicazioni: 'AGRIMASTER (3009799)' },
    { pageTag: '49/03', articolo: '56601', aMm: '70', bMm: '160', foroOrAsola: '20.5', rMm: '160', pesoKg: '2.25', applicazioni: 'FACMA; AGRICOM' },
    { pageTag: '49/03', articolo: '56117', aMm: '70', bMm: '160', foroOrAsola: '22.5', rMm: '160', pesoKg: '2.25', applicazioni: 'FACMA' },
    { pageTag: '49/03', articolo: '56803', aMm: '10', bMm: '85', foroOrAsola: '14.5', rMm: '100', pesoKg: '0.38', applicazioni: 'MURATORI OEM 12019400' },
    { pageTag: '49/03', articolo: '57318', aMm: '42', bMm: '80', foroOrAsola: '13', rMm: '80', pesoKg: '0.42', applicazioni: 'GEO; FEMAC' },
    { pageTag: '49/03', articolo: '56789', aMm: '30', bMm: '105', foroOrAsola: '36.5', rMm: '75', pesoKg: '1.25', applicazioni: 'MERITANO' },
    { pageTag: '49/03', articolo: '56806', aMm: '22', bMm: '75', foroOrAsola: '16.5', rMm: '92', pesoKg: '0.67', applicazioni: 'HMF; VIGOLO' },
    { pageTag: '49/03', articolo: '57317', aMm: '40', bMm: '130', foroOrAsola: '16.5', rMm: '110', pesoKg: '1.05', applicazioni: 'MASCHIO (BC; BE; BL; VITA; BELLA; BRAVA; TRITONE)' },
    { pageTag: '49/03', articolo: '57443', aMm: '44', bMm: '60', foroOrAsola: '25.5', rMm: '70', pesoKg: '0.75', applicazioni: 'AGRIMASTER OEM 3008045' },
    { pageTag: '49/03', articolo: '57459', aMm: '47', bMm: '85', foroOrAsola: '14.5', rMm: '97', pesoKg: '0.65', applicazioni: 'AGRIMASTER' },
    { pageTag: '49/03', articolo: '57384', aMm: '10', bMm: '62', foroOrAsola: '14.5', rMm: '62', pesoKg: '0.21', applicazioni: 'CALDERONI; ORSI; TORTELLA; UBALDI; FERRI; SICMA' },
    { pageTag: '49/03', articolo: '56792', aMm: '51', bMm: '88', foroOrAsola: '26', rMm: '180', pesoKg: '2.17', applicazioni: 'NOBILI' },
    { pageTag: '50/03', articolo: '57460', aMm: '73', bMm: '165', foroOrAsola: '18.5', rMm: '114', pesoKg: '1.75', applicazioni: 'FACMA' },
    { pageTag: '50/03', articolo: '57464', aMm: '24', bMm: '64', foroOrAsola: '16.5', rMm: '113', pesoKg: '0.75', applicazioni: 'FERRI OEM 0901147' },
    { pageTag: '50/03', articolo: '57467', aMm: '32', bMm: '95', foroOrAsola: '22.5', rMm: '100', pesoKg: '0.70', applicazioni: 'NOBILI' },
    { pageTag: '50/03', articolo: '57608', aMm: '40', bMm: '95', foroOrAsola: '16.5', rMm: '95', pesoKg: '0.78', applicazioni: 'SICMA' },
    { pageTag: '50/03', articolo: '57468', aMm: '45', bMm: '125', foroOrAsola: '25.5', rMm: '177', pesoKg: '1.55', applicazioni: 'MASCHIO OEM T30004025' },
    { pageTag: '50/03', articolo: '57465', aMm: '10', bMm: '65', foroOrAsola: '12.5', rMm: '87', pesoKg: '0.20', applicazioni: 'PERUZZO' },
    { pageTag: '50/03', articolo: '57463', aMm: '24', bMm: '100', foroOrAsola: '16.5', rMm: '110', pesoKg: '0.95', applicazioni: 'FERRI OEM 0901134' },
    { pageTag: '50/03', articolo: '57630', aMm: '54', bMm: '148', foroOrAsola: '25.5', rMm: '96', pesoKg: '2.04', applicazioni: 'FALC' },
    { pageTag: '50/03', articolo: '57733', aMm: '54', bMm: '148', foroOrAsola: '20.5', rMm: '96', pesoKg: '2.04', applicazioni: 'FALC (new)' },
    { pageTag: '51/03', articolo: '57631', aMm: '54', bMm: '105', foroOrAsola: '25.5', rMm: '95', pesoKg: '1.60', applicazioni: 'FALC' },
    { pageTag: '51/03', articolo: '57696', aMm: '70', bMm: '118', foroOrAsola: '16.5', rMm: '110', pesoKg: '1.47', applicazioni: 'FERRI OEM 0901196' },
    { pageTag: '51/03', articolo: '57715', aMm: '81', bMm: '171', foroOrAsola: '20.5', rMm: '95', pesoKg: '2.70', applicazioni: 'FERNANDEZ' },
    { pageTag: '51/03', articolo: '57713', aMm: '80', bMm: '190', foroOrAsola: '18.5', rMm: '95', pesoKg: '2.00', applicazioni: 'NIUBO' },
    { pageTag: '51/03', articolo: '57714', aMm: '80', bMm: '190', foroOrAsola: '23', rMm: '95', pesoKg: '2.00', applicazioni: 'NIUBO' },
    { pageTag: '51/03', articolo: '57697', aMm: '13', bMm: '40', foroOrAsola: '16x32', rMm: '75', pesoKg: '0.41', applicazioni: 'BOMFORD; BRUNI' },
    { pageTag: '51/03', articolo: '57632', aMm: '40', bMm: '100', foroOrAsola: '20.5', rMm: '171', pesoKg: '1.95', applicazioni: 'BERTI tipo lungo' },
    { pageTag: '51/03', articolo: '57693', aMm: '42', bMm: '105', foroOrAsola: '16.5', rMm: '120', pesoKg: '1.40', applicazioni: 'FERRI' },
    { pageTag: '51/03', articolo: '57694', aMm: '42', bMm: '105', foroOrAsola: '20.5', rMm: '120', pesoKg: '', applicazioni: 'FERRI' },
    { pageTag: '51/03', articolo: '57695', aMm: '42', bMm: '105', foroOrAsola: '25.5', rMm: '120', pesoKg: '', applicazioni: 'FEMAC' },
    { pageTag: '51/03', articolo: '57676', aMm: '70', bMm: '170', foroOrAsola: '16.5', rMm: '90', pesoKg: '2.10', applicazioni: 'KUHN DX' },
    { pageTag: '51/03', articolo: '57677', aMm: '70', bMm: '170', foroOrAsola: '20.5', rMm: '90', pesoKg: '', applicazioni: 'HMF' },
    { pageTag: '52/03', articolo: '57708', aMm: '81', bMm: '125', foroOrAsola: '35', rMm: '109', pesoKg: '2.70', applicazioni: 'SERRAT' },
    { pageTag: '52/03', articolo: '57710', aMm: '60', bMm: '151', foroOrAsola: '28.5', rMm: '98', pesoKg: '1.90', applicazioni: 'TMC CANCELA' },
    { pageTag: '52/03', articolo: '57712', aMm: '80', bMm: '110', foroOrAsola: '28.5', rMm: '98', pesoKg: '2.27', applicazioni: 'TMC CANCELA' },
    { pageTag: '52/03', articolo: '57731', aMm: '40', bMm: '90', foroOrAsola: '16.5', rMm: '100', pesoKg: '0.87', applicazioni: 'COSMO; GEO; STARK' },
    { pageTag: '52/03', articolo: '57727', aMm: '51', bMm: '115', foroOrAsola: '26', rMm: '175', pesoKg: '1.42', applicazioni: 'KUHN' },
    { pageTag: '52/03', articolo: '57728', aMm: '13', bMm: '78', foroOrAsola: '12.5', rMm: '75', pesoKg: '0.28', applicazioni: 'COSMO; MASCHIO; DRAGONE' },
    { pageTag: '52/03', articolo: '57729', aMm: '13', bMm: '78', foroOrAsola: '14.5', rMm: '75', pesoKg: '0.28', applicazioni: '' },
    { pageTag: '52/03', articolo: '57730', aMm: '13', bMm: '78', foroOrAsola: '16.5', rMm: '75', pesoKg: '0.28', applicazioni: '' },
    { pageTag: '52/03', articolo: '57711', aMm: '87', bMm: '224', foroOrAsola: '20.5', rMm: '78', pesoKg: '2.70', applicazioni: 'TMC CANCELA' },
    { pageTag: '52/03', articolo: '57709', aMm: '82', bMm: '123', foroOrAsola: '20.5', rMm: '105', pesoKg: '2.00', applicazioni: 'SERRAT' },
    { pageTag: '52a/03', articolo: '', aMm: '', bMm: '', foroOrAsola: '', rMm: '', pesoKg: '', applicazioni: '' },
  ];

  protected readonly foroValues = computed(() => Array.from(
    new Set(this.blades.map((blade) => blade.foroOrAsola).filter((value) => value !== '' && Number.isFinite(Number(value)))),
  ).sort((left, right) => Number(left) - Number(right)));

  protected readonly filteredBlades = computed(() => this.blades.filter((blade) =>
    this.matchesRange(blade.aMm, this.aMin(), this.aMax()) &&
    this.matchesRange(blade.bMm, this.bMin(), this.bMax()) &&
    this.matchesRange(blade.rMm, this.rMin(), this.rMax()) &&
    this.matchesRange(blade.pesoKg, this.pesoMin(), this.pesoMax()) &&
    this.matchesForoValue(blade.foroOrAsola),
  ));

  protected readonly sortedBlades = computed(() => {
    const column = this.sortColumn();
    const direction = this.sortDirection();
    const multiplier = direction === 'asc' ? 1 : -1;

    return [...this.filteredBlades()].sort((left, right) => {
      const leftValue = left[column];
      const rightValue = right[column];

      if (!leftValue || !rightValue) {
        if (!leftValue && !rightValue) {
          return 0;
        }

        return leftValue ? -1 : 1;
      }

      const leftNumber = Number(leftValue);
      const rightNumber = Number(rightValue);
      const areNumbers = Number.isFinite(leftNumber) && Number.isFinite(rightNumber);
      const comparison = areNumbers
        ? leftNumber - rightNumber
        : leftValue.localeCompare(rightValue, 'it', { numeric: true, sensitivity: 'base' });

      return comparison * multiplier;
    });
  });

  protected sortBy(column: BladeSortColumn): void {
    if (this.sortColumn() === column) {
      this.sortDirection.update((direction) => direction === 'asc' ? 'desc' : 'asc');
      return;
    }

    this.sortColumn.set(column);
    this.sortDirection.set('asc');
  }

  protected ariaSort(column: BladeSortColumn): 'ascending' | 'descending' | 'none' {
    if (this.sortColumn() !== column) {
      return 'none';
    }

    return this.sortDirection() === 'asc' ? 'ascending' : 'descending';
  }

  protected sortIndicator(column: BladeSortColumn): string {
    if (this.sortColumn() !== column) {
      return '↕';
    }

    return this.sortDirection() === 'asc' ? '↑' : '↓';
  }

  protected resetFilters(): void {
    this.aMin.set('10');
    this.aMax.set('87');
    this.bMin.set('40');
    this.bMax.set('224');
    this.rMin.set('62');
    this.rMax.set('180');
    this.pesoMin.set('0.20');
    this.pesoMax.set('2.70');
    this.foroValue.set('');
  }

  private matchesRange(value: string, minimum: string, maximum: string): boolean {
    // If the field is blank/unknown, include the record (don't exclude it by range filters).
    if (value === '' || value == null) {
      return true;
    }

    if (!minimum && !maximum) {
      return true;
    }

    const numericValue = Number(value);

    // If the value is not a finite number, treat it as unknown and include it.
    if (!Number.isFinite(numericValue)) {
      return true;
    }

    const numericMinimum = minimum === '' || minimum == null ? Number.NEGATIVE_INFINITY : Number(minimum);
    const numericMaximum = maximum === '' || maximum == null ? Number.POSITIVE_INFINITY : Number(maximum);

    return numericValue >= numericMinimum && numericValue <= numericMaximum;
  }

  private matchesForoValue(value: string): boolean {
    return !this.foroValue() || value === this.foroValue();
  }

  protected openMazzaImage(blade: BladeRecord): void {
    // Determine the absolute index of the blade within the master blades array.
    let index = this.blades.indexOf(blade);

    // If the blade isn't found (shouldn't happen), try to find it by articolo.
    if (index === -1) {
      index = this.blades.findIndex((b) => b.articolo && b.articolo === blade.articolo);
    }

    // Default to first image if still not found.
    if (index === -1) {
      index = 0;
    }

    const page = Math.floor(index / 16);
    const imagePath = `/assets/images/mazze-set-${page}.png`;

    this.modalImage.set(imagePath);
    this.modalOpen.set(true);
  }

  protected closeMazzaImage(): void {
    this.modalOpen.set(false);
    this.modalImage.set('');
  }
}

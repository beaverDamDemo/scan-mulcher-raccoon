import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeader } from '../../components/page-header/page-header';

@Component({
  selector: 'app-ricerca-pezzi-di-ricambio',
  imports: [RouterLink, PageHeader],
  templateUrl: './ricerca-pezzi-di-ricambio.html',
  styleUrl: './ricerca-pezzi-di-ricambio.css',
})
export class RicercaPezziDiRicambio {
  protected readonly query = signal('');
  protected readonly debouncedQuery = signal('');
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  onKeyUp(event: KeyboardEvent): void {
    const target = event.target as HTMLInputElement;
    const value = target?.value ?? '';
    this.query.set(value);
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.debouncedQuery.set(value);
      this.debounceTimer = null;
    }, 400);
  }
}



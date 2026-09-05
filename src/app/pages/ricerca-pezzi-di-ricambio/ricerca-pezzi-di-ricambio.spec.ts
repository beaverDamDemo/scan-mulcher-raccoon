import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { RicercaPezziDiRicambio } from './ricerca-pezzi-di-ricambio';

interface ShopTemplateCreator {
  createShopSearchTemplate(value: string): string | null;
}

describe('RicercaPezziDiRicambio', () => {
  let component: RicercaPezziDiRicambio;
  let fixture: ComponentFixture<RicercaPezziDiRicambio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RicercaPezziDiRicambio],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RicercaPezziDiRicambio);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('opens a new tab for every generated shop URL', () => {
    vi.useFakeTimers();
    const openSpy = vi.spyOn(window, 'open');
    const input = fixture.nativeElement.querySelector('#pezzi-query') as HTMLInputElement;

    input.value = 'test part';
    input.dispatchEvent(new Event('input'));
    vi.advanceTimersByTime(400);
    component.onCerca();

    expect(openSpy).toHaveBeenCalledTimes(6);
    expect(openSpy).toHaveBeenCalledWith(
      'https://www.ceneje.si/Iskanje/Izdelki?q=test%20part',
      '_blank',
      'noopener,noreferrer',
    );
    vi.useRealTimers();
  });

  it('removes stale part references from a pasted search URL', () => {
    const templateCreator = component as unknown as ShopTemplateCreator;
    const template = templateCreator.createShopSearchTemplate(
      'https://b2b.farmcommerce.si/products/0.171.2614.0%2F10.aspx?view=search&q=2.4119.134.0&searchedString=0.171.2614.0%2F10#lsearch=0.171.2614.0%2F10',
    );

    expect(template).toBe('https://b2b.farmcommerce.si/products/0.171.2614.0%2F10.aspx?view=search&q={q}');
  });
});
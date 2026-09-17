import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { RicercaPezziDiRicambio } from './ricerca-pezzi-di-ricambio';

interface ShopTemplateCreator {
  createShopSearchTemplate(value: string): string | null;
}

interface SavedShopCreator {
  createSavedShop(value: string): { template: string; spaceDelimiter: string | null; } | null;
  createShopSearchUrl(template: string, query: string, spaceDelimiter?: string | null): string;
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

  it('treats a bare numeric path segment as the real search anchor (agricolaricambi, kramp)', () => {
    const templateCreator = component as unknown as ShopTemplateCreator;

    expect(templateCreator.createShopSearchTemplate(
      'https://www.agricolaricambi.it/ITA/804502/ricerca_riferimento.html?q=881987',
    )).toBe('https://www.agricolaricambi.it/ITA/{q}/ricerca_riferimento.html');

    expect(templateCreator.createShopSearchTemplate(
      'https://www.kramp.com/shop-si/sl/search/804502?q=881987',
    )).toBe('https://www.kramp.com/shop-si/sl/search/{q}');
  });

  it('handles a path-only reference URL with no query string (agricolaricambi confirmed working URL)', () => {
    const templateCreator = component as unknown as ShopTemplateCreator;
    const template = templateCreator.createShopSearchTemplate(
      'https://www.agricolaricambi.it/ITA/804502/ricerca_riferimento.html',
    );

    expect(template).toBe('https://www.agricolaricambi.it/ITA/{q}/ricerca_riferimento.html');
  });

  it('strips a stale numeric reference id from a query parameter (gbricambi)', () => {
    const templateCreator = component as unknown as ShopTemplateCreator;
    const template = templateCreator.createShopSearchTemplate(
      'https://shop.gbricambi.it/orderentry/catalogo.action?task=search&code=804502&q=881987',
    );

    expect(template).toBe('https://shop.gbricambi.it/orderentry/catalogo.action?task=search&q={q}');
  });

  it('templates the search key inside the hash fragment instead of clearing it (agroizbira)', () => {
    const templateCreator = component as unknown as ShopTemplateCreator;
    const template = templateCreator.createShopSearchTemplate(
      'https://www.agroizbira.si/products.aspx?view=search&q=881987#search=804502',
    );

    expect(template).toBe('https://www.agroizbira.si/products.aspx?view=search#search={q}');
  });

  it('handles the hash-bang search URL confirmed to work (agroizbira)', () => {
    const templateCreator = component as unknown as ShopTemplateCreator;
    const template = templateCreator.createShopSearchTemplate(
      'https://www.agroizbira.si/products.aspx?view=search#!search=804502',
    );

    expect(template).toBe('https://www.agroizbira.si/products.aspx?view=search#!search={q}');
  });

  it('detects the word separator from a two-word test query and applies it to new searches', () => {
    const shopCreator = component as unknown as SavedShopCreator;
    const shop = shopCreator.createSavedShop('https://shop.example.com/search?q=12345-abcde');

    expect(shop).not.toBeNull();
    expect(shop!.spaceDelimiter).toBe('-');
    expect(shopCreator.createShopSearchUrl(shop!.template, 'foo bar', shop!.spaceDelimiter))
      .toBe('https://shop.example.com/search?q=foo-bar');
  });

  it('defaults to encodeURIComponent spacing when no delimiter was detected', () => {
    const shopCreator = component as unknown as SavedShopCreator;
    const shop = shopCreator.createSavedShop('https://shop.example.com/search?q=somethingelse');

    expect(shop).not.toBeNull();
    expect(shop!.spaceDelimiter).toBeNull();
    expect(shopCreator.createShopSearchUrl(shop!.template, 'foo bar', shop!.spaceDelimiter))
      .toBe('https://shop.example.com/search?q=foo%20bar');
  });
});
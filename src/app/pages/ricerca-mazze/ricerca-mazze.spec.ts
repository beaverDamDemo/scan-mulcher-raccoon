import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RicercaMazze } from './ricerca-mazze';

describe('RicercaMazze', () => {
  let component: RicercaMazze;
  let fixture: ComponentFixture<RicercaMazze>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RicercaMazze],
    }).compileComponents();

    fixture = TestBed.createComponent(RicercaMazze);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

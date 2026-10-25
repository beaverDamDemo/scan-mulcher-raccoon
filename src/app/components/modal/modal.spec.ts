import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Modal } from './modal';

describe('Modal', () => {
  let component: Modal;
  let fixture: ComponentFixture<Modal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Modal],
    }).compileComponents();

    fixture = TestBed.createComponent(Modal);
    fixture.componentRef.setInput('heading', 'Titolo');
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should label the dialog with its heading', () => {
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('h2')?.textContent).toContain('Titolo');
  });

  it('should emit closed when the close button is clicked', () => {
    let emitted = false;
    component.closed.subscribe(() => (emitted = true));
    fixture.nativeElement.querySelector('.modal__close').click();
    expect(emitted).toBe(true);
  });
});

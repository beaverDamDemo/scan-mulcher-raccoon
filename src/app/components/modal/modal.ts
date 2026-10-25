import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';

let nextModalId = 0;

@Component({
  selector: 'app-modal',
  styleUrl: './modal.css',
  templateUrl: './modal.html',
})
export class Modal {
  readonly heading = input.required<string>();
  readonly closeLabel = input('Chiudi finestra');
  readonly closed = output<void>();

  protected readonly headingId = `app-modal-heading-${nextModalId++}`;
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private previouslyFocused: HTMLElement | null = null;

  constructor() {
    afterNextRender(() => {
      const active = document.activeElement;
      this.previouslyFocused = active instanceof HTMLElement ? active : null;
      this.dialog().nativeElement.showModal();
    });

    inject(DestroyRef).onDestroy(() => {
      if (this.isBrowser) {
        this.previouslyFocused?.focus();
      }
    });
  }

  protected onCancel(event: Event): void {
    event.preventDefault();
    this.closed.emit();
  }

  protected onDialogClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closed.emit();
    }
  }
}

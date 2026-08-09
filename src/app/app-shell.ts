import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  host: {
    class: 'block min-h-screen',
  },
  template: `
    <router-outlet />
    <footer class="app-footer">
      <div class="app-footer__content">
        <span class="font-semibold">Scan Mulcher</span>
        <span class="text-white/80">Scansioni e ricerca ricambi</span>
      </div>
    </footer>
  `,
  styleUrl: './app-shell.css',
})
export class AppShell { }

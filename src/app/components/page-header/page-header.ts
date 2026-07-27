import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-page-header',
  imports: [RouterLink],
  templateUrl: './page-header.html',
  styleUrl: './page-header.css',
})
export class PageHeader {
  protected readonly title = input<string>('');
  protected readonly backLink = input<string>('/');
}

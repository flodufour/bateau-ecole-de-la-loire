import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { ScrollRevealDirective } from '../../shared/directives/scroll-reveal.directive';

@Component({
  selector: 'app-home',
  imports: [RouterLink, ScrollRevealDirective],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly sanitizer = inject(DomSanitizer);

  // Google's no-API-key embed URL (not the JS Maps SDK, no secret involved).
  // The address is a hardcoded constant, never user input, so bypassing
  // Angular's iframe-src sanitization here is safe.
  protected readonly mapUrl: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
    "https://maps.google.com/maps?q=58+boulevard+de+l'%C3%A9galit%C3%A9,+44100+Nantes&output=embed",
  );
}

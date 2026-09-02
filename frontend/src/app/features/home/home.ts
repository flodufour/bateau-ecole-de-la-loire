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

  // Real reviews copied verbatim from the school's Google Maps listing
  // (checked 2026-09-02: 5,0 / 148 avis) — not invented testimonials.
  protected readonly googleRating = '5,0';
  protected readonly googleReviewCount = 148;
  protected readonly testimonials = [
    {
      author: 'Matthieu Paquito',
      text: "Bateau école au top ! Pour le contact avec le moniteur plus que compétent qui est aussi très convivial, la possibilité de trouver un premier rdv rapidement et d'enchainer aussi les cours et l'épreuve pratique très vite.",
    },
    {
      author: 'Eloi R-A',
      text: "Parfait. Accompagnement de À a Z entre le livret, les questionnaires en ligne pour se tester, les séances en salle, la navigation. Ali explique très bien et on sent qu'il aime transmettre sa passion.",
    },
    {
      author: 'Tom Boisard',
      text: 'Super moniteur, Ali est super réactif, il fait tout pour que vous puissiez passer votre permis le plus rapidement et sereinement possible. Côtier & fluvial en moins de 10 jours, pratique comprise !',
    },
  ];
}

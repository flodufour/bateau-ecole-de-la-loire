import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Permit } from '../../../core/models/permit.model';

// Dumb/presentational: takes a Permit in, renders it, no service dependencies —
// see frontend/docs/architecture.md's "Smart vs dumb components".
@Component({
  selector: 'app-permit-card',
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './permit-card.html',
  styleUrl: './permit-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermitCard {
  readonly permit = input.required<Permit>();
}

import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Session } from '../../../core/models/session.model';

// Dumb/presentational — booking a session is the parent's job (it needs
// BookingService + feedback state), this just emits the intent.
@Component({
  selector: 'app-session-card',
  imports: [DatePipe],
  templateUrl: './session-card.html',
  styleUrl: './session-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionCard {
  readonly session = input.required<Session>();
  readonly disabled = input(false);

  readonly book = output<string>();
}

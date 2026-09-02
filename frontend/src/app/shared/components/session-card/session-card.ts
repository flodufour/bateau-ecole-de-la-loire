import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { BookingStatus } from '../../../core/models/booking.model';
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
  // The caller's own booking for this session, if any (Cancelled excluded —
  // that's not a reason to block re-booking). Non-null replaces "Réserver"
  // with a disabled, greyed-out button showing the status instead.
  readonly bookingStatus = input<BookingStatus | null>(null);

  readonly book = output<string>();
}

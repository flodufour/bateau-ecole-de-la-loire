import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { BookingStatus } from '../../core/models/booking.model';
import { Permit } from '../../core/models/permit.model';
import { Session, SessionType } from '../../core/models/session.model';
import { BookingService } from '../../core/services/booking.service';
import { PermitService } from '../../core/services/permit.service';
import { SessionService } from '../../core/services/session.service';
import { extractApiErrors } from '../../core/utils/api-error.util';
import { SessionCard } from '../../shared/components/session-card/session-card';

interface FeedbackMessage {
  text: string;
  isError: boolean;
}

@Component({
  selector: 'app-booking-page',
  imports: [ReactiveFormsModule, SessionCard],
  templateUrl: './booking-page.html',
  styleUrl: './booking-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingPage {
  private readonly fb = inject(FormBuilder);
  private readonly sessionService = inject(SessionService);
  private readonly bookingService = inject(BookingService);
  private readonly permitService = inject(PermitService);

  protected readonly permits = signal<Permit[]>([]);
  protected readonly sessions = signal<Session[]>([]);
  protected readonly loaded = signal(false);
  protected readonly failed = signal(false);
  protected readonly bookingSessionId = signal<string | null>(null);
  protected readonly message = signal<FeedbackMessage | null>(null);

  // Non-Cancelled bookings only — a cancelled one isn't a reason to block
  // re-booking the same session. A non-Student visiting this page (it's
  // only authGuard, not Student-only — see frontend/docs/security.md) gets
  // a 403 from GET /bookings/me; that's treated the same as "none yet".
  protected readonly myBookings = signal<Map<string, BookingStatus>>(new Map());

  protected readonly filters = this.fb.nonNullable.group({
    type: [''],
    permitId: [''],
    date: [''],
  });

  constructor() {
    this.permitService.getAll().subscribe((permits) => this.permits.set(permits));
    this.loadSessions();
    this.loadMyBookings();
    this.filters.valueChanges.subscribe(() => this.loadSessions());
  }

  protected book(sessionId: string): void {
    this.message.set(null);
    this.bookingSessionId.set(sessionId);

    this.bookingService.create(sessionId).subscribe({
      next: () => {
        this.bookingSessionId.set(null);
        this.message.set({
          text: 'Réservation effectuée ! Retrouvez-la dans votre espace personnel.',
          isError: false,
        });
        this.loadSessions();
        this.loadMyBookings();
      },
      error: (error: unknown) => {
        this.bookingSessionId.set(null);
        this.message.set({ text: extractApiErrors(error).join(' '), isError: true });
      },
    });
  }

  private loadMyBookings(): void {
    this.bookingService.getMine().subscribe({
      next: (bookings) => {
        const bySession = new Map<string, BookingStatus>();
        for (const booking of bookings) {
          if (booking.status !== 'Cancelled') bySession.set(booking.sessionId, booking.status);
        }
        this.myBookings.set(bySession);
      },
      error: () => this.myBookings.set(new Map()),
    });
  }

  private loadSessions(): void {
    const raw = this.filters.getRawValue();

    this.sessionService
      .getUpcoming({
        type: raw.type ? (raw.type as SessionType) : undefined,
        permitId: raw.permitId || undefined,
        date: raw.date || undefined,
      })
      .subscribe({
        next: (sessions) => {
          this.sessions.set(sessions);
          this.loaded.set(true);
        },
        error: () => {
          this.failed.set(true);
          this.loaded.set(true);
        },
      });
  }
}

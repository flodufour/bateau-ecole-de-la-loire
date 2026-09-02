import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Booking } from '../../core/models/booking.model';
import { UserRole } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { BookingService } from '../../core/services/booking.service';
import { BookingStatusBadge } from '../../shared/components/booking-status-badge/booking-status-badge';

const ROLE_LABELS: Record<UserRole, string> = {
  Student: 'Étudiant',
  Instructor: 'Moniteur',
  Admin: 'Administrateur',
};

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, RouterLink, BookingStatusBadge],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly auth = inject(AuthService);
  private readonly bookingService = inject(BookingService);

  // authGuard already guarantees a session on this route.
  protected readonly currentUser = this.auth.currentUser;

  protected readonly bookings = signal<Booking[]>([]);
  protected readonly loaded = signal(false);
  protected readonly cancellingId = signal<string | null>(null);

  constructor() {
    this.load();
  }

  protected roleLabel(role: UserRole): string {
    return ROLE_LABELS[role];
  }

  protected cancel(id: string): void {
    this.cancellingId.set(id);

    this.bookingService.cancel(id).subscribe({
      next: () => {
        this.cancellingId.set(null);
        this.bookings.update((bookings) =>
          bookings.map((b) => (b.id === id ? { ...b, status: 'Cancelled' as const } : b)),
        );
      },
      error: () => this.cancellingId.set(null),
    });
  }

  private load(): void {
    this.bookingService.getMine().subscribe({
      next: (bookings) => {
        this.bookings.set(bookings);
        this.loaded.set(true);
      },
      error: () => this.loaded.set(true),
    });
  }
}

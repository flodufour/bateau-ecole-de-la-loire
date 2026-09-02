import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Booking } from '../../../core/models/booking.model';
import { BookingService } from '../../../core/services/booking.service';
import { BookingStatusBadge } from '../../../shared/components/booking-status-badge/booking-status-badge';

@Component({
  selector: 'app-bookings-admin',
  imports: [DatePipe, BookingStatusBadge],
  templateUrl: './bookings-admin.html',
  styleUrl: './bookings-admin.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingsAdmin {
  private readonly bookingService = inject(BookingService);

  protected readonly bookings = signal<Booking[]>([]);
  protected readonly loaded = signal(false);
  protected readonly confirmingId = signal<string | null>(null);

  constructor() {
    this.load();
  }

  protected confirm(booking: Booking): void {
    this.confirmingId.set(booking.id);
    this.bookingService.confirm(booking.id).subscribe({
      next: () => {
        this.confirmingId.set(null);
        this.bookings.update((bookings) =>
          bookings.map((b) => (b.id === booking.id ? { ...b, status: 'Confirmed' as const } : b)),
        );
      },
      error: () => this.confirmingId.set(null),
    });
  }

  private load(): void {
    this.bookingService.getAll().subscribe((bookings) => {
      this.bookings.set(bookings);
      this.loaded.set(true);
    });
  }
}

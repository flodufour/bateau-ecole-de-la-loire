import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Booking } from '../../core/models/booking.model';
import { PermitPurchase } from '../../core/models/permit-purchase.model';
import { UserRole } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { BookingService } from '../../core/services/booking.service';
import { PurchaseService } from '../../core/services/purchase.service';
import { extractApiErrors } from '../../core/utils/api-error.util';
import { BookingStatusBadge } from '../../shared/components/booking-status-badge/booking-status-badge';

const ROLE_LABELS: Record<UserRole, string> = {
  Student: 'Étudiant',
  Instructor: 'Moniteur',
  Admin: 'Administrateur',
};

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, CurrencyPipe, RouterLink, ReactiveFormsModule, BookingStatusBadge],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly bookingService = inject(BookingService);
  private readonly purchaseService = inject(PurchaseService);

  // authGuard already guarantees a session on this route.
  protected readonly currentUser = this.auth.currentUser;

  protected readonly bookings = signal<Booking[]>([]);
  protected readonly loaded = signal(false);
  protected readonly cancellingId = signal<string | null>(null);

  protected readonly purchases = signal<PermitPurchase[]>([]);
  protected readonly purchasesLoaded = signal(false);
  protected readonly transferringId = signal<string | null>(null);
  protected readonly transferSubmitting = signal(false);
  protected readonly transferErrors = signal<string[]>([]);

  protected readonly transferForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  constructor() {
    this.load();
    this.loadPurchases();
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

  protected startTransfer(purchase: PermitPurchase): void {
    this.transferringId.set(purchase.id);
    this.transferErrors.set([]);
    this.transferForm.reset();
  }

  protected cancelTransfer(): void {
    this.transferringId.set(null);
  }

  protected submitTransfer(purchaseId: string): void {
    if (this.transferForm.invalid || this.transferSubmitting()) {
      this.transferForm.markAllAsTouched();
      return;
    }

    this.transferErrors.set([]);
    this.transferSubmitting.set(true);
    const email = this.transferForm.getRawValue().email;

    this.purchaseService.transfer(purchaseId, email).subscribe({
      next: () => {
        this.transferSubmitting.set(false);
        this.transferringId.set(null);
        this.purchases.update((purchases) => purchases.filter((p) => p.id !== purchaseId));
      },
      error: (error: unknown) => {
        this.transferSubmitting.set(false);
        this.transferErrors.set(extractApiErrors(error));
      },
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

  private loadPurchases(): void {
    this.purchaseService.getMine().subscribe({
      next: (purchases) => {
        this.purchases.set(purchases);
        this.purchasesLoaded.set(true);
      },
      error: () => this.purchasesLoaded.set(true),
    });
  }
}

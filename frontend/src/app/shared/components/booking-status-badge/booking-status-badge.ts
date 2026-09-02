import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BookingStatus } from '../../../core/models/booking.model';

const LABELS: Record<BookingStatus, string> = {
  Pending: 'En attente',
  Confirmed: 'Confirmée',
  Cancelled: 'Annulée',
};

const CLASSES: Record<BookingStatus, string> = {
  Pending: 'badge',
  Confirmed: 'badge badge--success',
  Cancelled: 'badge badge--danger',
};

@Component({
  selector: 'app-booking-status-badge',
  template: `<span [class]="cssClass()">{{ label() }}</span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingStatusBadge {
  readonly status = input.required<BookingStatus>();

  protected readonly label = computed(() => LABELS[this.status()]);
  protected readonly cssClass = computed(() => CLASSES[this.status()]);
}

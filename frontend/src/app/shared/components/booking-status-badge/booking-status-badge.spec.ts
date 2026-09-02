import { TestBed } from '@angular/core/testing';
import { BookingStatus } from '../../../core/models/booking.model';
import { BookingStatusBadge } from './booking-status-badge';

describe('BookingStatusBadge', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [BookingStatusBadge] }).compileComponents();
  });

  const cases: Array<[BookingStatus, string]> = [
    ['Pending', 'En attente'],
    ['Confirmed', 'Confirmée'],
    ['Cancelled', 'Annulée'],
  ];

  for (const [status, label] of cases) {
    it(`renders the French label for status ${status}`, () => {
      const fixture = TestBed.createComponent(BookingStatusBadge);
      fixture.componentRef.setInput('status', status);
      fixture.detectChanges();

      expect((fixture.nativeElement as HTMLElement).textContent?.trim()).toBe(label);
    });
  }
});

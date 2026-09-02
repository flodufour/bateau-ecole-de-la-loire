import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { Booking } from '../../../core/models/booking.model';
import { BookingsAdmin } from './bookings-admin';

describe('BookingsAdmin', () => {
  let fixture: ComponentFixture<BookingsAdmin>;
  let element: HTMLElement;
  let httpMock: HttpTestingController;

  const pendingBooking: Booking = {
    id: 'b1',
    sessionId: 's1',
    permitName: 'Permis Côtier',
    sessionType: 'Theory',
    sessionStartsAt: '2026-09-10T10:00:00Z',
    instructorName: 'Jean Dupont',
    studentName: 'Marie Martin',
    status: 'Pending',
    bookedAt: '2026-09-02T08:00:00Z',
  };
  const confirmedBooking: Booking = { ...pendingBooking, id: 'b2', status: 'Confirmed' };

  function createAndFlushInitialLoad(): void {
    fixture = TestBed.createComponent(BookingsAdmin);
    element = fixture.nativeElement;
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/bookings`).flush([pendingBooking, confirmedBooking]);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingsAdmin],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lists all bookings across students', () => {
    createAndFlushInitialLoad();

    expect(element.textContent).toContain('Marie Martin');
  });

  it('shows a confirm button only for Pending bookings', () => {
    createAndFlushInitialLoad();

    const rows = element.querySelectorAll('tbody tr');
    expect(rows[0].querySelector('button')?.textContent?.trim()).toBe('Confirmer');
    expect(rows[1].querySelector('button')).toBeNull();
  });

  it('confirms a booking and updates its badge in place', () => {
    createAndFlushInitialLoad();

    element.querySelector<HTMLButtonElement>('tbody tr button')!.click();

    httpMock.expectOne(`${environment.apiUrl}/bookings/${pendingBooking.id}/confirm`).flush(null);
    fixture.detectChanges();

    const firstRow = element.querySelectorAll('tbody tr')[0];
    expect(firstRow.textContent).toContain('Confirmée');
    expect(firstRow.querySelector('button')).toBeNull();
  });
});

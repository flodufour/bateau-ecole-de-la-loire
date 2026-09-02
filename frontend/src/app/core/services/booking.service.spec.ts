import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { Booking } from '../models/booking.model';
import { BookingService } from './booking.service';

describe('BookingService', () => {
  let service: BookingService;
  let httpMock: HttpTestingController;

  const booking: Booking = {
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

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BookingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getMine fetches the current user\'s bookings', () => {
    let result: Booking[] | undefined;
    service.getMine().subscribe((bookings) => (result = bookings));

    httpMock.expectOne(`${environment.apiUrl}/bookings/me`).flush([booking]);

    expect(result).toEqual([booking]);
  });

  it('create posts the session id and returns the new booking', () => {
    let result: Booking | undefined;
    service.create(booking.sessionId).subscribe((b) => (result = b));

    const req = httpMock.expectOne(`${environment.apiUrl}/bookings`);
    expect(req.request.body).toEqual({ sessionId: booking.sessionId });
    req.flush(booking);

    expect(result).toEqual(booking);
  });

  it('cancel deletes the booking by id', () => {
    let completed = false;
    service.cancel(booking.id).subscribe(() => (completed = true));

    httpMock.expectOne(`${environment.apiUrl}/bookings/${booking.id}`).flush(null);

    expect(completed).toBeTrue();
  });
});

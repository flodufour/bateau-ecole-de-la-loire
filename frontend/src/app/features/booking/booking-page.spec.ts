import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Booking } from '../../core/models/booking.model';
import { Session } from '../../core/models/session.model';
import { BookingPage } from './booking-page';

describe('BookingPage', () => {
  let fixture: ComponentFixture<BookingPage>;
  let element: HTMLElement;
  let httpMock: HttpTestingController;

  const session: Session = {
    id: 's1',
    permitId: 'p1',
    permitName: 'Permis Côtier',
    instructorId: 'i1',
    instructorName: 'Jean Dupont',
    type: 'Theory',
    startsAt: '2026-09-10T10:00:00Z',
    durationMinutes: 90,
    maxCapacity: 8,
    location: 'Nantes centre',
  };

  const myBooking: Booking = {
    id: 'b1',
    sessionId: session.id,
    permitName: session.permitName,
    sessionType: session.type,
    sessionStartsAt: session.startsAt,
    instructorName: session.instructorName,
    studentName: 'Marie Martin',
    status: 'Pending',
    bookedAt: '2026-09-01T08:00:00Z',
  };

  function createAndFlush(bookings: Booking[] = []): void {
    fixture = TestBed.createComponent(BookingPage);
    element = fixture.nativeElement;
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/permits`).flush([]);
    httpMock.expectOne((r) => r.url === `${environment.apiUrl}/sessions`).flush([session]);
    httpMock.expectOne(`${environment.apiUrl}/bookings/me`).flush(bookings);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('renders a session card per session returned by the API', () => {
    createAndFlush();

    expect(element.querySelectorAll('app-session-card').length).toBe(1);
  });

  it('books a session and shows a success message', () => {
    createAndFlush();

    element.querySelector<HTMLButtonElement>('.session-card button')!.click();

    const req = httpMock.expectOne(`${environment.apiUrl}/bookings`);
    expect(req.request.body).toEqual({ sessionId: 's1' });
    req.flush(myBooking);

    // Booking success triggers a session list + own-bookings refresh.
    httpMock.expectOne((r) => r.url === `${environment.apiUrl}/sessions`).flush([session]);
    httpMock.expectOne(`${environment.apiUrl}/bookings/me`).flush([myBooking]);
    fixture.detectChanges();

    expect(element.textContent).toContain('Réservation effectuée');
  });

  it('shows the backend error when booking fails (e.g. session full)', () => {
    createAndFlush();

    element.querySelector<HTMLButtonElement>('.session-card button')!.click();

    httpMock
      .expectOne(`${environment.apiUrl}/bookings`)
      .flush({ errors: ['Cette séance est complète.'] }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();

    expect(element.textContent).toContain('Cette séance est complète.');
  });

  it('shows a greyed "En attente" button for a session already booked by the caller', () => {
    createAndFlush([myBooking]);

    const button = element.querySelector<HTMLButtonElement>('.session-card button')!;
    expect(button.disabled).toBeTrue();
    expect(button.textContent?.trim()).toBe('En attente');
  });

  it('shows a greyed "Confirmée" button for a confirmed booking', () => {
    createAndFlush([{ ...myBooking, status: 'Confirmed' }]);

    const button = element.querySelector<HTMLButtonElement>('.session-card button')!;
    expect(button.disabled).toBeTrue();
    expect(button.textContent?.trim()).toBe('Confirmée');
  });

  it('still allows booking a session whose only booking was cancelled', () => {
    createAndFlush([{ ...myBooking, status: 'Cancelled' }]);

    const button = element.querySelector<HTMLButtonElement>('.session-card button')!;
    expect(button.disabled).toBeFalse();
    expect(button.textContent?.trim()).toBe('Réserver');
  });

  it('treats a 403 from GET /bookings/me (a non-Student visiting) as no bookings', () => {
    fixture = TestBed.createComponent(BookingPage);
    element = fixture.nativeElement;
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/permits`).flush([]);
    httpMock.expectOne((r) => r.url === `${environment.apiUrl}/sessions`).flush([session]);
    httpMock
      .expectOne(`${environment.apiUrl}/bookings/me`)
      .flush(null, { status: 403, statusText: 'Forbidden' });
    fixture.detectChanges();

    const button = element.querySelector<HTMLButtonElement>('.session-card button')!;
    expect(button.textContent?.trim()).toBe('Réserver');
  });
});

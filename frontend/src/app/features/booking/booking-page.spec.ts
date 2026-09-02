import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(BookingPage);
    element = fixture.nativeElement;
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/permits`).flush([]);
    httpMock.expectOne((r) => r.url === `${environment.apiUrl}/sessions`).flush([session]);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('renders a session card per session returned by the API', () => {
    expect(element.querySelectorAll('app-session-card').length).toBe(1);
  });

  it('books a session and shows a success message', () => {
    element.querySelector<HTMLButtonElement>('.session-card button')!.click();

    const req = httpMock.expectOne(`${environment.apiUrl}/bookings`);
    expect(req.request.body).toEqual({ sessionId: 's1' });
    req.flush({
      id: 'b1',
      sessionId: 's1',
      permitName: 'Permis Côtier',
      sessionType: 'Theory',
      sessionStartsAt: session.startsAt,
      instructorName: 'Jean Dupont',
      studentName: 'Marie Martin',
      status: 'Pending',
      bookedAt: '2026-09-02T08:00:00Z',
    });

    // Booking success triggers a session list refresh.
    httpMock.expectOne((r) => r.url === `${environment.apiUrl}/sessions`).flush([session]);
    fixture.detectChanges();

    expect(element.textContent).toContain('Réservation effectuée');
  });

  it('shows the backend error when booking fails (e.g. session full)', () => {
    element.querySelector<HTMLButtonElement>('.session-card button')!.click();

    httpMock
      .expectOne(`${environment.apiUrl}/bookings`)
      .flush({ errors: ['Cette séance est complète.'] }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();

    expect(element.textContent).toContain('Cette séance est complète.');
  });
});

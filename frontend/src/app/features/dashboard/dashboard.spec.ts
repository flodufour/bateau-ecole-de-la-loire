import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Booking } from '../../core/models/booking.model';
import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let fixture: ComponentFixture<Dashboard>;
  let element: HTMLElement;
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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('shows an empty-state message with a link to book when there are no bookings', () => {
    fixture = TestBed.createComponent(Dashboard);
    element = fixture.nativeElement;
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/bookings/me`).flush([]);
    fixture.detectChanges();

    expect(element.textContent).toContain("Vous n'avez aucune réservation");
  });

  it('renders each booking with its status badge', () => {
    fixture = TestBed.createComponent(Dashboard);
    element = fixture.nativeElement;
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/bookings/me`).flush([booking]);
    fixture.detectChanges();

    expect(element.textContent).toContain('Permis Côtier');
    expect(element.textContent).toContain('En attente');
  });

  it('cancels a booking and updates its badge without refetching the whole list', () => {
    fixture = TestBed.createComponent(Dashboard);
    element = fixture.nativeElement;
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/bookings/me`).flush([booking]);
    fixture.detectChanges();

    element.querySelector<HTMLButtonElement>('.dashboard__item-actions button')!.click();

    httpMock.expectOne(`${environment.apiUrl}/bookings/${booking.id}`).flush(null);
    fixture.detectChanges();

    expect(element.textContent).toContain('Annulée');
    expect(element.querySelector('.dashboard__item-actions button')).toBeNull();
  });
});

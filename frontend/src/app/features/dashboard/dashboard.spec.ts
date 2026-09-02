import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Booking } from '../../core/models/booking.model';
import { PermitPurchase } from '../../core/models/permit-purchase.model';
import { User } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let fixture: ComponentFixture<Dashboard>;
  let element: HTMLElement;
  let httpMock: HttpTestingController;
  let auth: AuthService;

  const user: User = {
    id: 'a1',
    email: 'jean.dupont@example.com',
    firstName: 'Jean',
    lastName: 'Dupont',
    role: 'Student',
  };

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

  const purchase: PermitPurchase = {
    id: 'pp1',
    permitId: 'p1',
    permitName: 'Permis Hauturier',
    price: 273,
    purchasedAt: '2026-09-01T10:00:00Z',
  };

  function createAndFlush(bookings: Booking[] = [], purchases: PermitPurchase[] = []): void {
    fixture = TestBed.createComponent(Dashboard);
    element = fixture.nativeElement;
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/bookings/me`).flush(bookings);
    httpMock.expectOne(`${environment.apiUrl}/purchases/me`).flush(purchases);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => httpMock.verify());

  it("shows the current user's name, email, and role", () => {
    auth.login({ email: user.email, password: 'Password123!' }).subscribe();
    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush(user);

    createAndFlush();

    expect(element.textContent).toContain('Dupont');
    expect(element.textContent).toContain('Jean');
    expect(element.textContent).toContain('jean.dupont@example.com');
    expect(element.textContent).toContain('Étudiant');
  });

  it('shows an empty-state message with a link to book when there are no bookings', () => {
    createAndFlush();

    expect(element.textContent).toContain("Vous n'avez aucune réservation");
  });

  it('renders each booking with its status badge', () => {
    createAndFlush([booking]);

    expect(element.textContent).toContain('Permis Côtier');
    expect(element.textContent).toContain('En attente');
  });

  it('cancels a booking and updates its badge without refetching the whole list', () => {
    createAndFlush([booking]);

    element.querySelector<HTMLButtonElement>('.dashboard__item-actions button')!.click();

    httpMock.expectOne(`${environment.apiUrl}/bookings/${booking.id}`).flush(null);
    fixture.detectChanges();

    expect(element.textContent).toContain('Annulée');
    expect(element.querySelector('.dashboard__item-actions button')).toBeNull();
  });

  it('shows an empty-state message with a link to the catalog when there are no purchases', () => {
    createAndFlush();

    expect(element.textContent).toContain("Vous n'avez acheté aucun permis");
  });

  it('renders each purchased permit', () => {
    createAndFlush([], [purchase]);

    expect(element.textContent).toContain('Permis Hauturier');
    expect(element.textContent).toContain('273');
  });

  it('transfers a purchase to another email and removes it from the list', () => {
    createAndFlush([], [purchase]);

    element.querySelector<HTMLButtonElement>('.dashboard__purchases button')!.click();
    fixture.detectChanges();

    const input = element.querySelector<HTMLInputElement>('.dashboard__transfer-form input')!;
    input.value = 'marie.martin@example.com';
    input.dispatchEvent(new Event('input'));
    element.querySelector('.dashboard__transfer-form')!.dispatchEvent(new Event('submit'));

    const req = httpMock.expectOne(`${environment.apiUrl}/purchases/${purchase.id}/transfer`);
    expect(req.request.body).toEqual({ email: 'marie.martin@example.com' });
    req.flush({ ...purchase });
    fixture.detectChanges();

    expect(element.textContent).toContain("Vous n'avez acheté aucun permis");
  });

  it('shows backend errors when a transfer fails', () => {
    createAndFlush([], [purchase]);

    element.querySelector<HTMLButtonElement>('.dashboard__purchases button')!.click();
    fixture.detectChanges();

    const input = element.querySelector<HTMLInputElement>('.dashboard__transfer-form input')!;
    input.value = 'nobody@example.com';
    input.dispatchEvent(new Event('input'));
    element.querySelector('.dashboard__transfer-form')!.dispatchEvent(new Event('submit'));

    httpMock
      .expectOne(`${environment.apiUrl}/purchases/${purchase.id}/transfer`)
      .flush({ errors: ["Aucun compte n'existe avec cette adresse email."] }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();

    expect(element.textContent).toContain("Aucun compte n'existe avec cette adresse email.");
  });
});

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { Permit } from '../../../core/models/permit.model';
import { User } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';
import { PermitDetail } from './permit-detail';

describe('PermitDetail', () => {
  let httpMock: HttpTestingController;
  let auth: AuthService;

  const permit: Permit = {
    id: 'a1b2c3',
    name: 'Permis Côtier',
    slug: 'cotier',
    description: "Navigation jusqu'à 6 milles d'un abri",
    price: 450,
    includesTheory: true,
    includesPractical: true,
    isBundle: false,
  };

  const student: User = {
    id: 'u1',
    email: 'jean.dupont@example.com',
    firstName: 'Jean',
    lastName: 'Dupont',
    role: 'Student',
  };

  function setup(id: string | null): void {
    TestBed.configureTestingModule({
      imports: [PermitDetail],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } },
        },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  }

  function loginAs(user: User): void {
    auth.login({ email: user.email, password: 'Password123!' }).subscribe();
    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush(user);
  }

  afterEach(() => httpMock.verify());

  it('fetches and renders the permit matching the route id', () => {
    setup(permit.id);
    const fixture = TestBed.createComponent(PermitDetail);
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/permits/${permit.id}`).flush(permit);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Permis Côtier');
  });

  it('shows a not-found message when the id does not match any permit', () => {
    setup(permit.id);
    const fixture = TestBed.createComponent(PermitDetail);
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/permits/${permit.id}`).flush(null, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain("n'existe pas");
  });

  it('shows a not-found message and makes no request when the route has no id', () => {
    setup(null);
    const fixture = TestBed.createComponent(PermitDetail);
    fixture.detectChanges();

    httpMock.expectNone(() => true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain("n'existe pas");
  });

  it('shows a login link instead of a buy button when logged out', () => {
    setup(permit.id);
    const fixture = TestBed.createComponent(PermitDetail);
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/permits/${permit.id}`).flush(permit);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Se connecter pour acheter');
    expect(element.querySelector('button')).toBeNull();
  });

  it('buys the permit and shows a confirmation with a link to the dashboard', () => {
    setup(permit.id);
    loginAs(student);
    const fixture = TestBed.createComponent(PermitDetail);
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/permits/${permit.id}`).flush(permit);
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button')!.click();

    const req = httpMock.expectOne(`${environment.apiUrl}/purchases`);
    expect(req.request.body).toEqual({ permitId: permit.id });
    req.flush({ id: 'pp1', permitId: permit.id, permitName: permit.name, price: permit.price, purchasedAt: '2026-09-02T10:00:00Z' });
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Vous avez acheté ce permis');
  });

  it('does not show a buy button for a non-Student role', () => {
    setup(permit.id);
    loginAs({ ...student, role: 'Admin' });
    const fixture = TestBed.createComponent(PermitDetail);
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/permits/${permit.id}`).flush(permit);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('button')).toBeNull();
  });
});

import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';
import { AuthService } from '../services/auth.service';
import { authErrorInterceptor } from './auth-error.interceptor';

describe('authErrorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let auth: AuthService;

  const user: User = {
    id: 'a1b2c3',
    email: 'jean.dupont@example.com',
    firstName: 'Jean',
    lastName: 'Dupont',
    role: 'Student',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([authErrorInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => httpMock.verify());

  it('clears the local session when any request comes back 401', () => {
    auth.login({ email: user.email, password: 'Password123!' }).subscribe();
    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush(user);
    expect(auth.isAuthenticated()).toBeTrue();

    http.get('/api/bookings/me').subscribe({ error: () => {} });
    httpMock.expectOne('/api/bookings/me').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(auth.isAuthenticated()).toBeFalse();
  });

  it('leaves other error statuses untouched', () => {
    auth.login({ email: user.email, password: 'Password123!' }).subscribe();
    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush(user);

    http.get('/api/bookings/me').subscribe({ error: () => {} });
    httpMock.expectOne('/api/bookings/me').flush(null, { status: 500, statusText: 'Server Error' });

    expect(auth.isAuthenticated()).toBeTrue();
  });

  it('re-throws the error so callers still see it', () => {
    let caughtStatus: number | undefined;

    http.get('/api/bookings/me').subscribe({
      error: (err) => (caughtStatus = err.status),
    });
    httpMock.expectOne('/api/bookings/me').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(caughtStatus).toBe(401);
  });
});

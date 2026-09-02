import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const user: User = {
    id: 'a1b2c3',
    email: 'jean.dupont@example.com',
    firstName: 'Jean',
    lastName: 'Dupont',
    role: 'Student',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('starts with no current user', () => {
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('login sets the current user on success', () => {
    service.login({ email: user.email, password: 'Password123!' }).subscribe();

    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush(user);

    expect(service.currentUser()).toEqual(user);
    expect(service.isAuthenticated()).toBeTrue();
  });

  it('register sets the current user on success', () => {
    service
      .register({ email: user.email, password: 'Password123!', firstName: 'Jean', lastName: 'Dupont' })
      .subscribe();

    httpMock.expectOne(`${environment.apiUrl}/auth/register`).flush(user);

    expect(service.currentUser()).toEqual(user);
  });

  it('logout clears the current user', () => {
    service.login({ email: user.email, password: 'Password123!' }).subscribe();
    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush(user);

    service.logout().subscribe();
    httpMock.expectOne(`${environment.apiUrl}/auth/logout`).flush(null);

    expect(service.currentUser()).toBeNull();
  });

  it('restoreSession sets the current user when the session cookie is still valid', () => {
    service.restoreSession().subscribe();

    httpMock.expectOne(`${environment.apiUrl}/auth/me`).flush(user);

    expect(service.currentUser()).toEqual(user);
    expect(service.sessionRestored()).toBeTrue();
  });

  it('restoreSession leaves currentUser null when there is no valid session, without erroring', () => {
    let restoredValue: User | null | undefined;

    service.restoreSession().subscribe((value) => (restoredValue = value));

    httpMock.expectOne(`${environment.apiUrl}/auth/me`).flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(restoredValue).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(service.sessionRestored()).toBeTrue();
  });

  it('clearSession clears the current user without an HTTP call', () => {
    service.login({ email: user.email, password: 'Password123!' }).subscribe();
    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush(user);

    service.clearSession();

    expect(service.currentUser()).toBeNull();
  });

  it('forgotPassword posts the email', () => {
    let completed = false;
    service.forgotPassword(user.email).subscribe(() => (completed = true));

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/forgot-password`);
    expect(req.request.body).toEqual({ email: user.email });
    req.flush(null);

    expect(completed).toBeTrue();
  });

  it('resetPassword posts the email, token, and new password', () => {
    let completed = false;
    service.resetPassword(user.email, 'a-reset-token', 'NewPassword123!').subscribe(() => (completed = true));

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/reset-password`);
    expect(req.request.body).toEqual({ email: user.email, token: 'a-reset-token', newPassword: 'NewPassword123!' });
    req.flush(null);

    expect(completed).toBeTrue();
  });
});

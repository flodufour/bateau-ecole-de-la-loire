import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';
import { AuthService } from '../services/auth.service';
import { roleGuard } from './role.guard';

describe('roleGuard', () => {
  let auth: AuthService;
  let router: Router;
  let httpMock: HttpTestingController;

  const student: User = {
    id: 'a1',
    email: 'jean.dupont@example.com',
    firstName: 'Jean',
    lastName: 'Dupont',
    role: 'Student',
  };
  const admin: User = { ...student, id: 'a2', role: 'Admin' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    auth = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  function runGuard(): boolean | UrlTree {
    return TestBed.runInInjectionContext(() => roleGuard('Admin')({} as never, {} as never)) as boolean | UrlTree;
  }

  it('allows navigation when the current user has the required role', () => {
    auth.login({ email: admin.email, password: 'Password123!' }).subscribe();
    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush(admin);

    expect(runGuard()).toBeTrue();
  });

  it('redirects to / when the user is authenticated but has the wrong role', () => {
    auth.login({ email: student.email, password: 'Password123!' }).subscribe();
    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush(student);

    const result = runGuard();

    expect(result instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(result as UrlTree)).toBe('/');
  });

  it('redirects to /connexion when there is no authenticated user', () => {
    const result = runGuard();

    expect(router.serializeUrl(result as UrlTree)).toBe('/connexion');
  });
});

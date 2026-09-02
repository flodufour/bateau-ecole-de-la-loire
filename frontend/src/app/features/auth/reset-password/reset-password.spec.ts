import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { ResetPassword } from './reset-password';

describe('ResetPassword', () => {
  let httpMock: HttpTestingController;

  function setup(queryParams: Record<string, string>): { fixture: ComponentFixture<ResetPassword>; element: HTMLElement } {
    TestBed.configureTestingModule({
      imports: [ResetPassword],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(queryParams) } } },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(ResetPassword);
    const element = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    return { fixture, element };
  }

  afterEach(() => httpMock.verify());

  it('shows an invalid-link message and makes no request when email/token are missing from the URL', () => {
    const { element } = setup({});

    httpMock.expectNone(() => true);
    expect(element.textContent).toContain('invalide');
  });

  it('resets the password and redirects to /connexion on success', () => {
    const { fixture, element } = setup({ email: 'jean.dupont@example.com', token: 'a-token' });
    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');

    const input = element.querySelector<HTMLInputElement>('input[type="password"]')!;
    input.value = 'NewPassword123!';
    input.dispatchEvent(new Event('input'));
    element.querySelector('form')!.dispatchEvent(new Event('submit'));

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/reset-password`);
    expect(req.request.body).toEqual({ email: 'jean.dupont@example.com', token: 'a-token', newPassword: 'NewPassword123!' });
    req.flush(null);
    fixture.detectChanges();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/connexion');
  });

  it('shows the backend error when the token is invalid or expired', () => {
    const { fixture, element } = setup({ email: 'jean.dupont@example.com', token: 'a-token' });

    const input = element.querySelector<HTMLInputElement>('input[type="password"]')!;
    input.value = 'NewPassword123!';
    input.dispatchEvent(new Event('input'));
    element.querySelector('form')!.dispatchEvent(new Event('submit'));

    httpMock
      .expectOne(`${environment.apiUrl}/auth/reset-password`)
      .flush({ errors: ['Lien de réinitialisation invalide ou expiré.'] }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();

    expect(element.textContent).toContain('Lien de réinitialisation invalide ou expiré.');
  });
});

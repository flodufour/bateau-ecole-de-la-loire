import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { ForgotPassword } from './forgot-password';

describe('ForgotPassword', () => {
  let fixture: ComponentFixture<ForgotPassword>;
  let element: HTMLElement;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotPassword],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ForgotPassword);
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  function submitEmail(email: string): void {
    const input = element.querySelector<HTMLInputElement>('input[type="email"]')!;
    input.value = email;
    input.dispatchEvent(new Event('input'));
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  it('shows the same confirmation message whether or not the email exists', () => {
    submitEmail('jean.dupont@example.com');

    httpMock.expectOne(`${environment.apiUrl}/auth/forgot-password`).flush(null);
    fixture.detectChanges();

    expect(element.textContent).toContain('un lien de réinitialisation vient d\'être envoyé');
  });

  it('shows the same confirmation message even when the request errors (e.g. rate-limited)', () => {
    submitEmail('jean.dupont@example.com');

    httpMock
      .expectOne(`${environment.apiUrl}/auth/forgot-password`)
      .flush(null, { status: 429, statusText: 'Too Many Requests' });
    fixture.detectChanges();

    expect(element.textContent).toContain('un lien de réinitialisation vient d\'être envoyé');
  });

  it('does not call the API for an invalid email', () => {
    submitEmail('not-an-email');

    httpMock.expectNone(`${environment.apiUrl}/auth/forgot-password`);
    expect(element.querySelector('.submit-button')).toBeTruthy();
  });
});

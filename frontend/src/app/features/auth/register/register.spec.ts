import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { User } from '../../../core/models/user.model';
import { Register } from './register';

describe('Register', () => {
  let fixture: ComponentFixture<Register>;
  let element: HTMLElement;
  let httpMock: HttpTestingController;
  let router: Router;

  const user: User = {
    id: 'a1b2c3',
    email: 'jean.dupont@example.com',
    firstName: 'Jean',
    lastName: 'Dupont',
    role: 'Student',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(Register);
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  function setInputValue(selector: string, value: string): void {
    const input = element.querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  function fillForm(): void {
    setInputValue('input[formcontrolname="firstName"]', user.firstName);
    setInputValue('input[formcontrolname="lastName"]', user.lastName);
    setInputValue('input[type="email"]', user.email);
    setInputValue('input[type="password"]', 'Password123!');
  }

  function submitForm(): void {
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  it('rejects a password under 8 characters before ever calling the API', () => {
    fillForm();
    setInputValue('input[type="password"]', 'short');

    submitForm();

    httpMock.expectNone(`${environment.apiUrl}/auth/register`);
    expect(element.querySelector('.submit-button')?.textContent?.trim()).toBe('Créer mon compte');
  });

  it('registers and navigates home on valid submit', () => {
    spyOn(router, 'navigateByUrl');
    fillForm();

    submitForm();
    httpMock.expectOne(`${environment.apiUrl}/auth/register`).flush(user);

    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('shows the backend error message when the email is already taken', () => {
    fillForm();

    submitForm();
    httpMock
      .expectOne(`${environment.apiUrl}/auth/register`)
      .flush({ errors: ['Cet email est déjà utilisé.'] }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();

    expect(element.textContent).toContain('Cet email est déjà utilisé.');
  });
});

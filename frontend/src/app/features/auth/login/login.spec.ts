import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { User } from '../../../core/models/user.model';
import { Login } from './login';

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
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
      imports: [Login],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(Login);
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  function fillForm(email: string, password: string): void {
    setInputValue('input[type="email"]', email);
    setInputValue('input[type="password"]', password);
  }

  function setInputValue(selector: string, value: string): void {
    const input = element.querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  function submitForm(): void {
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  it('does not call the API when the form is invalid', () => {
    submitForm();

    httpMock.expectNone(`${environment.apiUrl}/auth/login`);
    expect(element.querySelector('.submit-button')?.textContent?.trim()).toBe('Se connecter');
  });

  it('logs in and navigates home on valid submit', () => {
    spyOn(router, 'navigateByUrl');
    fillForm(user.email, 'Password123!');

    submitForm();
    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush(user);

    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('shows the backend error message on failed login', () => {
    fillForm(user.email, 'WrongPassword!');

    submitForm();
    httpMock
      .expectOne(`${environment.apiUrl}/auth/login`)
      .flush({ errors: ['Email ou mot de passe incorrect.'] }, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();

    expect(element.textContent).toContain('Email ou mot de passe incorrect.');
  });
});

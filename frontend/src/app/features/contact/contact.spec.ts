import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { Contact } from './contact';

describe('Contact', () => {
  let fixture: ComponentFixture<Contact>;
  let element: HTMLElement;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Contact],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Contact);
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  function fillAndSubmit(): void {
    setInput('input[formcontrolname="name"]', 'Jean Dupont');
    setInput('input[formcontrolname="email"]', 'jean.dupont@example.com');
    const textarea = element.querySelector<HTMLTextAreaElement>('textarea[formcontrolname="message"]')!;
    textarea.value = 'Je souhaite des informations sur le permis côtier.';
    textarea.dispatchEvent(new Event('input'));
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
  }

  function setInput(selector: string, value: string): void {
    const input = element.querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  it('shows the school\'s contact info', () => {
    expect(element.textContent).toContain('58 boulevard de l\'égalité');
    expect(element.textContent).toContain('bateauecoledelaloire@gmail.com');
  });

  it('submits the message and shows a confirmation', () => {
    fillAndSubmit();

    const req = httpMock.expectOne(`${environment.apiUrl}/contact`);
    expect(req.request.body).toEqual({
      name: 'Jean Dupont',
      email: 'jean.dupont@example.com',
      phone: null,
      message: 'Je souhaite des informations sur le permis côtier.',
    });
    req.flush({});
    fixture.detectChanges();

    expect(element.textContent).toContain('Votre message a bien été envoyé');
  });

  it('shows backend validation errors and lets the user retry', () => {
    fillAndSubmit();

    httpMock
      .expectOne(`${environment.apiUrl}/contact`)
      .flush({ errors: ['Adresse email invalide.'] }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();

    expect(element.textContent).toContain('Adresse email invalide.');
    expect(element.querySelector('form')).toBeTruthy();
  });

  it('does not call the API when the form is invalid', () => {
    element.querySelector('form')!.dispatchEvent(new Event('submit'));

    httpMock.expectNone(`${environment.apiUrl}/contact`);
    expect(element.querySelector('.submit-button')).toBeTruthy();
  });
});

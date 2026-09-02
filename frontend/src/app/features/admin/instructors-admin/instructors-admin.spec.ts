import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { Instructor } from '../../../core/models/instructor.model';
import { InstructorsAdmin } from './instructors-admin';

describe('InstructorsAdmin', () => {
  let fixture: ComponentFixture<InstructorsAdmin>;
  let element: HTMLElement;
  let httpMock: HttpTestingController;

  const instructor: Instructor = {
    id: 'i1',
    firstName: 'Jean',
    lastName: 'Dupont',
    bio: 'Moniteur expérimenté',
    photoUrl: null,
    specialties: ['cotier'],
  };

  function createAndFlushInitialLoad(): void {
    fixture = TestBed.createComponent(InstructorsAdmin);
    element = fixture.nativeElement;
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/instructors`).flush([instructor]);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstructorsAdmin],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lists existing instructors with their specialties', () => {
    createAndFlushInitialLoad();

    expect(element.textContent).toContain('Jean Dupont');
    expect(element.textContent).toContain('cotier');
  });

  it('creates an instructor, splitting the comma-separated specialties field', () => {
    createAndFlushInitialLoad();

    setInput('input[formcontrolname="email"]', 'marie.martin@example.com');
    setInput('input[formcontrolname="password"]', 'Password123!');
    setInput('input[formcontrolname="firstName"]', 'Marie');
    setInput('input[formcontrolname="lastName"]', 'Martin');
    setInput('input[formcontrolname="bio"]', 'bio');
    setInput('input[formcontrolname="specialtiesText"]', 'cotier, hauturier');

    element.querySelector('form')!.dispatchEvent(new Event('submit'));

    const req = httpMock.expectOne(`${environment.apiUrl}/instructors`);
    expect(req.request.body).toEqual({
      email: 'marie.martin@example.com',
      password: 'Password123!',
      firstName: 'Marie',
      lastName: 'Martin',
      bio: 'bio',
      specialties: ['cotier', 'hauturier'],
    });
    req.flush({ ...instructor, id: 'i2', firstName: 'Marie', lastName: 'Martin' });

    httpMock.expectOne(`${environment.apiUrl}/instructors`).flush([instructor]);
  });

  it('shows the backend error when the email is already in use', () => {
    createAndFlushInitialLoad();

    setInput('input[formcontrolname="email"]', 'jean.dupont@example.com');
    setInput('input[formcontrolname="password"]', 'Password123!');
    setInput('input[formcontrolname="firstName"]', 'Jean');
    setInput('input[formcontrolname="lastName"]', 'Dupont');
    setInput('input[formcontrolname="bio"]', 'bio');

    element.querySelector('form')!.dispatchEvent(new Event('submit'));

    httpMock
      .expectOne(`${environment.apiUrl}/instructors`)
      .flush({ errors: ['Cet email est déjà utilisé.'] }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();

    expect(element.textContent).toContain('Cet email est déjà utilisé.');
  });

  function setInput(selector: string, value: string): void {
    const input = element.querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }
});

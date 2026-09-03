import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { Instructor } from '../../../core/models/instructor.model';
import { Permit } from '../../../core/models/permit.model';
import { Session } from '../../../core/models/session.model';
import { SessionsAdmin } from './sessions-admin';

describe('SessionsAdmin', () => {
  let fixture: ComponentFixture<SessionsAdmin>;
  let element: HTMLElement;
  let httpMock: HttpTestingController;

  const permit: Permit = {
    id: 'p1',
    name: 'Permis Côtier',
    slug: 'cotier',
    description: 'desc',
    price: 450,
    includesTheory: true,
    includesPractical: true,
    isBundle: false,
  };
  const instructor: Instructor = {
    id: 'i1',
    firstName: 'Jean',
    lastName: 'Dupont',
    bio: 'bio',
    photoUrl: null,
    specialties: [],
  };
  const session: Session = {
    id: 's1',
    permitId: permit.id,
    permitName: permit.name,
    instructorId: instructor.id,
    instructorName: 'Jean Dupont',
    type: 'Theory',
    startsAt: '2026-09-10T10:00:00Z',
    durationMinutes: 90,
    maxCapacity: 8,
    location: 'Nantes centre',
  };

  function createAndFlushInitialLoad(myInstructor?: Instructor): void {
    fixture = TestBed.createComponent(SessionsAdmin);
    element = fixture.nativeElement;
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/permits`).flush([permit]);
    httpMock.expectOne(`${environment.apiUrl}/instructors`).flush([instructor]);
    const meRequest = httpMock.expectOne(`${environment.apiUrl}/instructors/me`);
    if (myInstructor) {
      meRequest.flush(myInstructor);
    } else {
      meRequest.flush(null, { status: 404, statusText: 'Not Found' });
    }
    httpMock.expectOne((r) => r.url === `${environment.apiUrl}/sessions`).flush([session]);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionsAdmin],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lists sessions with permit and instructor names', () => {
    createAndFlushInitialLoad();

    expect(element.textContent).toContain('Permis Côtier');
    expect(element.textContent).toContain('Jean Dupont');
  });

  it('populates the permit and instructor selects', () => {
    createAndFlushInitialLoad();

    expect(element.querySelectorAll('select[formcontrolname="permitId"] option').length).toBe(2); // placeholder + 1
    expect(element.querySelectorAll('select[formcontrolname="instructorId"] option').length).toBe(2);
  });

  it('shows a validation message instead of silently doing nothing when the form is incomplete', () => {
    createAndFlushInitialLoad();

    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(element.textContent).toContain('Veuillez remplir tous les champs.');
  });

  it('does not mark any instructor as "(moi)" when the Admin has no instructor profile', () => {
    createAndFlushInitialLoad();

    expect(element.textContent).not.toContain('(moi)');
  });

  it('marks the Admin\'s own instructor profile with "(moi)" in the dropdown', () => {
    createAndFlushInitialLoad(instructor);

    const option = element.querySelector<HTMLOptionElement>(
      `select[formcontrolname="instructorId"] option[value="${instructor.id}"]`,
    )!;
    expect(option.textContent).toContain('(moi)');
  });

  it('shows the backend error when creating with an invalid reference', () => {
    createAndFlushInitialLoad();

    const permitSelect = element.querySelector<HTMLSelectElement>('select[formcontrolname="permitId"]')!;
    permitSelect.value = permit.id;
    permitSelect.dispatchEvent(new Event('change'));
    const instructorSelect = element.querySelector<HTMLSelectElement>('select[formcontrolname="instructorId"]')!;
    instructorSelect.value = instructor.id;
    instructorSelect.dispatchEvent(new Event('change'));
    const dateInput = element.querySelector<HTMLInputElement>('input[formcontrolname="startsAt"]')!;
    dateInput.value = '2026-09-15T10:00';
    dateInput.dispatchEvent(new Event('input'));
    const locationInput = element.querySelector<HTMLInputElement>('input[formcontrolname="location"]')!;
    locationInput.value = 'Nantes';
    locationInput.dispatchEvent(new Event('input'));

    element.querySelector('form')!.dispatchEvent(new Event('submit'));

    httpMock
      .expectOne(`${environment.apiUrl}/sessions`)
      .flush({ errors: ['Moniteur introuvable.'] }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();

    expect(element.textContent).toContain('Moniteur introuvable.');
  });

  it('deletes a session', () => {
    createAndFlushInitialLoad();

    element.querySelectorAll<HTMLButtonElement>('.admin-table__actions button')[1].click();

    httpMock.expectOne(`${environment.apiUrl}/sessions/${session.id}`).flush(null);
    httpMock.expectOne((r) => r.url === `${environment.apiUrl}/sessions`).flush([]);
    fixture.detectChanges();

    expect(element.textContent).not.toContain('Nantes centre');
  });
});

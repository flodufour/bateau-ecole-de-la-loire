import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { AvailabilitySlot } from '../../core/models/availability-slot.model';
import { Instructor } from '../../core/models/instructor.model';
import { Session } from '../../core/models/session.model';
import { InstructorPortal } from './instructor-portal';

describe('InstructorPortal', () => {
  let fixture: ComponentFixture<InstructorPortal>;
  let element: HTMLElement;
  let httpMock: HttpTestingController;

  const instructor: Instructor = {
    id: 'i1',
    firstName: 'Jean',
    lastName: 'Dupont',
    bio: 'Moniteur',
    photoUrl: null,
    specialties: [],
  };

  // Dated relative to "now" (not a fixed string) so it always falls inside
  // the calendar's default (Monday-start) week, whatever day the suite runs on.
  function startOfWeek(date: Date): Date {
    const start = new Date(date);
    const day = start.getDay();
    start.setDate(start.getDate() + (day === 0 ? -6 : 1 - day));
    start.setHours(10, 0, 0, 0);
    return start;
  }

  const session: Session = {
    id: 's1',
    permitId: 'p1',
    permitName: 'Permis Côtier',
    instructorId: instructor.id,
    instructorName: 'Jean Dupont',
    type: 'Theory',
    startsAt: new Date().toISOString(),
    durationMinutes: 90,
    maxCapacity: 8,
    location: 'Nantes centre',
  };

  // Tuesday of next week — always outside the current week, regardless of
  // what "today" is when the suite runs.
  const nextWeekTuesday = startOfWeek(new Date());
  nextWeekTuesday.setDate(nextWeekTuesday.getDate() + 8);
  const nextWeekSession: Session = {
    ...session,
    id: 's2',
    permitName: 'Permis Hauturier',
    startsAt: nextWeekTuesday.toISOString(),
  };

  const slot: AvailabilitySlot = {
    id: 'a1',
    instructorId: instructor.id,
    startsAt: '2026-09-11T09:00:00Z',
    endsAt: '2026-09-11T12:00:00Z',
  };

  function createAndFlushInitialLoad(): void {
    fixture = TestBed.createComponent(InstructorPortal);
    element = fixture.nativeElement;
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/instructors/me`).flush(instructor);
    httpMock.expectOne((r) => r.url === `${environment.apiUrl}/sessions`).flush([session]);
    httpMock.expectOne(`${environment.apiUrl}/instructors/${instructor.id}/availability`).flush([slot]);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstructorPortal],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('loads and shows the assigned sessions and availability slots', () => {
    createAndFlushInitialLoad();

    expect(element.textContent).toContain('Permis Côtier');
    expect(element.textContent).toContain('11/09/2026');
  });

  it('disables "Semaine précédente" on the current week, and does not show next week\'s sessions', () => {
    fixture = TestBed.createComponent(InstructorPortal);
    element = fixture.nativeElement;
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/instructors/me`).flush(instructor);
    httpMock.expectOne((r) => r.url === `${environment.apiUrl}/sessions`).flush([session, nextWeekSession]);
    httpMock.expectOne(`${environment.apiUrl}/instructors/${instructor.id}/availability`).flush([]);
    fixture.detectChanges();

    const buttons = Array.from(element.querySelectorAll('.instructor-portal__calendar-nav button'));
    expect((buttons[0] as HTMLButtonElement).disabled).toBeTrue();
    expect(element.textContent).toContain('Permis Côtier');
    expect(element.textContent).not.toContain('Permis Hauturier');
  });

  it('shows next week\'s sessions after clicking "Semaine suivante"', () => {
    fixture = TestBed.createComponent(InstructorPortal);
    element = fixture.nativeElement;
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/instructors/me`).flush(instructor);
    httpMock.expectOne((r) => r.url === `${environment.apiUrl}/sessions`).flush([session, nextWeekSession]);
    httpMock.expectOne(`${environment.apiUrl}/instructors/${instructor.id}/availability`).flush([]);
    fixture.detectChanges();

    const buttons = Array.from(element.querySelectorAll('.instructor-portal__calendar-nav button'));
    (buttons[1] as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(element.textContent).toContain('Permis Hauturier');
    expect(element.textContent).not.toContain('Permis Côtier');
  });

  it('filters the session request by the current instructor id', () => {
    fixture = TestBed.createComponent(InstructorPortal);
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/instructors/me`).flush(instructor);

    const sessionsReq = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/sessions`);
    expect(sessionsReq.request.params.get('instructorId')).toBe(instructor.id);
    sessionsReq.flush([]);

    httpMock.expectOne(`${environment.apiUrl}/instructors/${instructor.id}/availability`).flush([]);
  });

  it('adds an availability slot and reloads the list', () => {
    createAndFlushInitialLoad();

    setInput('input[formcontrolname="startsAt"]', '2026-09-12T09:00');
    setInput('input[formcontrolname="endsAt"]', '2026-09-12T12:00');
    element.querySelector('form')!.dispatchEvent(new Event('submit'));

    const createReq = httpMock.expectOne(`${environment.apiUrl}/instructors/${instructor.id}/availability`);
    expect(createReq.request.method).toBe('POST');
    createReq.flush(slot);

    httpMock.expectOne(`${environment.apiUrl}/instructors/${instructor.id}/availability`).flush([slot]);
  });

  it('shows a validation message instead of silently doing nothing when the availability form is incomplete', () => {
    createAndFlushInitialLoad();

    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(element.textContent).toContain('Veuillez remplir tous les champs.');
  });

  it('deletes an availability slot', () => {
    createAndFlushInitialLoad();

    element.querySelector<HTMLButtonElement>('.admin-table__actions button')!.click();

    httpMock.expectOne(`${environment.apiUrl}/instructors/${instructor.id}/availability/${slot.id}`).flush(null);
    httpMock.expectOne(`${environment.apiUrl}/instructors/${instructor.id}/availability`).flush([]);
    fixture.detectChanges();

    expect(element.textContent).toContain('Aucun créneau de disponibilité');
  });

  it('shows a "create my profile" form when the caller has none yet (an Admin who also teaches)', () => {
    fixture = TestBed.createComponent(InstructorPortal);
    element = fixture.nativeElement;
    fixture.detectChanges();

    httpMock
      .expectOne(`${environment.apiUrl}/instructors/me`)
      .flush(null, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(element.textContent).toContain('Créer mon profil moniteur');
  });

  it('shows a validation message instead of silently doing nothing when the profile form is incomplete', () => {
    fixture = TestBed.createComponent(InstructorPortal);
    element = fixture.nativeElement;
    fixture.detectChanges();

    httpMock
      .expectOne(`${environment.apiUrl}/instructors/me`)
      .flush(null, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(element.textContent).toContain('Veuillez remplir tous les champs.');
  });

  it('creates the profile and then loads sessions and availability', () => {
    fixture = TestBed.createComponent(InstructorPortal);
    element = fixture.nativeElement;
    fixture.detectChanges();

    httpMock
      .expectOne(`${environment.apiUrl}/instructors/me`)
      .flush(null, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    setInput('input[formcontrolname="bio"]', 'Moniteur et gérant');
    element.querySelector('form')!.dispatchEvent(new Event('submit'));

    const createReq = httpMock.expectOne(`${environment.apiUrl}/instructors/me`);
    expect(createReq.request.method).toBe('POST');
    createReq.flush(instructor);

    httpMock.expectOne(`${environment.apiUrl}/instructors/me`).flush(instructor);
    httpMock.expectOne((r) => r.url === `${environment.apiUrl}/sessions`).flush([]);
    httpMock.expectOne(`${environment.apiUrl}/instructors/${instructor.id}/availability`).flush([]);
    fixture.detectChanges();

    expect(element.textContent).toContain('Mes séances à venir');
  });

  function setInput(selector: string, value: string): void {
    const input = element.querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }
});

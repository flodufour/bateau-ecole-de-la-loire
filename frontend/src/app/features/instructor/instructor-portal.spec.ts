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

  const session: Session = {
    id: 's1',
    permitId: 'p1',
    permitName: 'Permis Côtier',
    instructorId: instructor.id,
    instructorName: 'Jean Dupont',
    type: 'Theory',
    startsAt: '2026-09-10T10:00:00Z',
    durationMinutes: 90,
    maxCapacity: 8,
    location: 'Nantes centre',
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

  it('deletes an availability slot', () => {
    createAndFlushInitialLoad();

    element.querySelector<HTMLButtonElement>('.admin-table__actions button')!.click();

    httpMock.expectOne(`${environment.apiUrl}/instructors/${instructor.id}/availability/${slot.id}`).flush(null);
    httpMock.expectOne(`${environment.apiUrl}/instructors/${instructor.id}/availability`).flush([]);
    fixture.detectChanges();

    expect(element.textContent).toContain('Aucun créneau de disponibilité');
  });

  function setInput(selector: string, value: string): void {
    const input = element.querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }
});

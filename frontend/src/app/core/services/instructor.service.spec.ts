import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { AvailabilitySlot } from '../models/availability-slot.model';
import { Instructor } from '../models/instructor.model';
import { InstructorService } from './instructor.service';

describe('InstructorService', () => {
  let service: InstructorService;
  let httpMock: HttpTestingController;

  const instructor: Instructor = {
    id: 'i1',
    firstName: 'Jean',
    lastName: 'Dupont',
    bio: 'Moniteur expérimenté',
    photoUrl: null,
    specialties: ['cotier'],
  };

  const slot: AvailabilitySlot = {
    id: 'a1',
    instructorId: instructor.id,
    startsAt: '2026-09-10T09:00:00Z',
    endsAt: '2026-09-10T12:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(InstructorService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getAll fetches the instructor list', () => {
    let result: Instructor[] | undefined;
    service.getAll().subscribe((instructors) => (result = instructors));

    httpMock.expectOne(`${environment.apiUrl}/instructors`).flush([instructor]);

    expect(result).toEqual([instructor]);
  });

  it('getMe fetches the current instructor profile', () => {
    let result: Instructor | undefined;
    service.getMe().subscribe((i) => (result = i));

    httpMock.expectOne(`${environment.apiUrl}/instructors/me`).flush(instructor);

    expect(result).toEqual(instructor);
  });

  it('getById fetches a single instructor', () => {
    let result: Instructor | undefined;
    service.getById(instructor.id).subscribe((i) => (result = i));

    httpMock.expectOne(`${environment.apiUrl}/instructors/${instructor.id}`).flush(instructor);

    expect(result).toEqual(instructor);
  });

  it('create posts the new instructor request', () => {
    const request = {
      email: 'jean.dupont@example.com',
      password: 'Password123!',
      firstName: 'Jean',
      lastName: 'Dupont',
      bio: 'Moniteur expérimenté',
      specialties: ['cotier'],
    };
    let result: Instructor | undefined;
    service.create(request).subscribe((i) => (result = i));

    const req = httpMock.expectOne(`${environment.apiUrl}/instructors`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(instructor);

    expect(result).toEqual(instructor);
  });

  it('getAvailability fetches the slots for an instructor', () => {
    let result: AvailabilitySlot[] | undefined;
    service.getAvailability(instructor.id).subscribe((slots) => (result = slots));

    httpMock.expectOne(`${environment.apiUrl}/instructors/${instructor.id}/availability`).flush([slot]);

    expect(result).toEqual([slot]);
  });

  it('addAvailability posts the new slot request', () => {
    const request = { startsAt: slot.startsAt, endsAt: slot.endsAt };
    let result: AvailabilitySlot | undefined;
    service.addAvailability(instructor.id, request).subscribe((s) => (result = s));

    const req = httpMock.expectOne(`${environment.apiUrl}/instructors/${instructor.id}/availability`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(slot);

    expect(result).toEqual(slot);
  });

  it('deleteAvailability removes the slot by id', () => {
    service.deleteAvailability(instructor.id, slot.id).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/instructors/${instructor.id}/availability/${slot.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});

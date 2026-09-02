import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { Session } from '../models/session.model';
import { SessionService } from './session.service';

describe('SessionService', () => {
  let service: SessionService;
  let httpMock: HttpTestingController;

  const session: Session = {
    id: 's1',
    permitId: 'p1',
    permitName: 'Permis Côtier',
    instructorId: 'i1',
    instructorName: 'Jean Dupont',
    type: 'Theory',
    startsAt: '2026-09-10T10:00:00Z',
    durationMinutes: 90,
    maxCapacity: 8,
    location: 'Nantes centre',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SessionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getUpcoming with no filters calls the base endpoint', () => {
    let result: Session[] | undefined;
    service.getUpcoming().subscribe((sessions) => (result = sessions));

    const req = httpMock.expectOne(`${environment.apiUrl}/sessions`);
    expect(req.request.params.keys().length).toBe(0);
    req.flush([session]);

    expect(result).toEqual([session]);
  });

  it('getUpcoming forwards type, permitId, and date as query params', () => {
    service.getUpcoming({ type: 'Theory', permitId: 'p1', date: '2026-09-10' }).subscribe();

    const req = httpMock.expectOne(
      (r) => r.url === `${environment.apiUrl}/sessions` && r.params.get('type') === 'Theory',
    );
    expect(req.request.params.get('permitId')).toBe('p1');
    expect(req.request.params.get('date')).toBe('2026-09-10');
    req.flush([]);
  });

  it('getById fetches a single session', () => {
    let result: Session | undefined;
    service.getById(session.id).subscribe((s) => (result = s));

    httpMock.expectOne(`${environment.apiUrl}/sessions/${session.id}`).flush(session);

    expect(result).toEqual(session);
  });

  const input = {
    permitId: session.permitId,
    instructorId: session.instructorId,
    type: session.type,
    startsAt: session.startsAt,
    durationMinutes: session.durationMinutes,
    maxCapacity: session.maxCapacity,
    location: session.location,
  };

  it('create posts the session input', () => {
    service.create(input).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/sessions`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(input);
    req.flush(session);
  });

  it('update puts the session input to the given id', () => {
    service.update(session.id, input).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/sessions/${session.id}`);
    expect(req.request.method).toBe('PUT');
    req.flush(session);
  });

  it('delete removes the session by id', () => {
    service.delete(session.id).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/sessions/${session.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { ExamDate } from '../models/exam-date.model';
import { ExamDateService } from './exam-date.service';

describe('ExamDateService', () => {
  let service: ExamDateService;
  let httpMock: HttpTestingController;

  const examDate: ExamDate = {
    id: 'e1',
    permitType: 'cotier',
    date: '2026-10-01',
    location: 'Nantes',
    notes: null,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ExamDateService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getUpcoming fetches the exam date list', () => {
    let result: ExamDate[] | undefined;
    service.getUpcoming().subscribe((dates) => (result = dates));

    httpMock.expectOne(`${environment.apiUrl}/exam-dates`).flush([examDate]);

    expect(result).toEqual([examDate]);
  });

  it('create posts the new exam date request', () => {
    const request = { permitType: 'cotier', date: '2026-10-01', location: 'Nantes', notes: null };
    let result: ExamDate | undefined;
    service.create(request).subscribe((d) => (result = d));

    const req = httpMock.expectOne(`${environment.apiUrl}/exam-dates`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(examDate);

    expect(result).toEqual(examDate);
  });

  it('delete removes the exam date by id', () => {
    let completed = false;
    service.delete(examDate.id).subscribe(() => (completed = true));

    const req = httpMock.expectOne(`${environment.apiUrl}/exam-dates/${examDate.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(completed).toBeTrue();
  });
});

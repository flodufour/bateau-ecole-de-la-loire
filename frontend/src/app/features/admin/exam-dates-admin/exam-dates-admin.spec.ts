import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { ExamDate } from '../../../core/models/exam-date.model';
import { ExamDatesAdmin } from './exam-dates-admin';

describe('ExamDatesAdmin', () => {
  let fixture: ComponentFixture<ExamDatesAdmin>;
  let element: HTMLElement;
  let httpMock: HttpTestingController;

  const examDate: ExamDate = { id: 'e1', permitType: 'cotier', date: '2026-10-01', location: 'Nantes', notes: null };

  function createAndFlushInitialLoad(): void {
    fixture = TestBed.createComponent(ExamDatesAdmin);
    element = fixture.nativeElement;
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/exam-dates`).flush([examDate]);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExamDatesAdmin],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lists upcoming exam dates', () => {
    createAndFlushInitialLoad();

    expect(element.textContent).toContain('cotier');
    expect(element.textContent).toContain('Nantes');
  });

  it('creates an exam date and reloads the list', () => {
    createAndFlushInitialLoad();

    setInput('input[formcontrolname="permitType"]', 'hauturier');
    setInput('input[formcontrolname="date"]', '2026-11-01');
    setInput('input[formcontrolname="location"]', 'Saint-Nazaire');
    element.querySelector('form')!.dispatchEvent(new Event('submit'));

    const createReq = httpMock.expectOne(`${environment.apiUrl}/exam-dates`);
    expect(createReq.request.body).toEqual({
      permitType: 'hauturier',
      date: '2026-11-01',
      location: 'Saint-Nazaire',
      notes: null,
    });
    createReq.flush({ id: 'e2', permitType: 'hauturier', date: '2026-11-01', location: 'Saint-Nazaire', notes: null });

    httpMock.expectOne(`${environment.apiUrl}/exam-dates`).flush([examDate]);
  });

  it('deletes an exam date', () => {
    createAndFlushInitialLoad();

    element.querySelector<HTMLButtonElement>('.admin-table__actions button')!.click();

    httpMock.expectOne(`${environment.apiUrl}/exam-dates/${examDate.id}`).flush(null);
    httpMock.expectOne(`${environment.apiUrl}/exam-dates`).flush([]);
    fixture.detectChanges();

    expect(element.textContent).not.toContain('cotier');
  });

  function setInput(selector: string, value: string): void {
    const input = element.querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }
});

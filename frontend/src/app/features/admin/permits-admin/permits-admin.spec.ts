import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { Permit } from '../../../core/models/permit.model';
import { PermitsAdmin } from './permits-admin';

describe('PermitsAdmin', () => {
  let fixture: ComponentFixture<PermitsAdmin>;
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

  function createAndFlushInitialLoad(): void {
    fixture = TestBed.createComponent(PermitsAdmin);
    element = fixture.nativeElement;
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/permits`).flush([permit]);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PermitsAdmin],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lists existing permits', () => {
    createAndFlushInitialLoad();

    expect(element.textContent).toContain('Permis Côtier');
  });

  it('creates a permit and reloads the list', () => {
    createAndFlushInitialLoad();

    setInput('input[formcontrolname="name"]', 'Permis Hauturier');
    setInput('input[formcontrolname="slug"]', 'hauturier');
    setInput('input[formcontrolname="description"]', 'desc2');
    element.querySelector('form')!.dispatchEvent(new Event('submit'));

    const createReq = httpMock.expectOne(`${environment.apiUrl}/permits`);
    expect(createReq.request.method).toBe('POST');
    createReq.flush({ ...permit, id: 'p2', name: 'Permis Hauturier', slug: 'hauturier' });

    httpMock.expectOne(`${environment.apiUrl}/permits`).flush([permit]);
    fixture.detectChanges();

    expect(element.querySelector('.admin-form h2, h2')).toBeTruthy();
  });

  it('switches to edit mode and PUTs the updated permit', () => {
    createAndFlushInitialLoad();

    element.querySelector<HTMLButtonElement>('.admin-table__actions button')!.click();
    fixture.detectChanges();

    expect(element.textContent).toContain('Modifier le permis');

    setInput('input[formcontrolname="name"]', 'Permis Côtier modifié');
    element.querySelector('form')!.dispatchEvent(new Event('submit'));

    const updateReq = httpMock.expectOne(`${environment.apiUrl}/permits/${permit.id}`);
    expect(updateReq.request.method).toBe('PUT');
    expect(updateReq.request.body.name).toBe('Permis Côtier modifié');
    updateReq.flush({ ...permit, name: 'Permis Côtier modifié' });

    httpMock.expectOne(`${environment.apiUrl}/permits`).flush([permit]);
  });

  it('shows a validation message instead of silently doing nothing when the form is incomplete', () => {
    createAndFlushInitialLoad();

    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(element.textContent).toContain('Veuillez remplir tous les champs.');
  });

  it('shows the backend error when a delete is rejected', () => {
    createAndFlushInitialLoad();

    element.querySelectorAll<HTMLButtonElement>('.admin-table__actions button')[1].click();

    httpMock
      .expectOne(`${environment.apiUrl}/permits/${permit.id}`)
      .flush({ errors: ['Ce permis a des séances associées, impossible de le supprimer.'] }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();

    expect(element.textContent).toContain('impossible de le supprimer');
  });

  function setInput(selector: string, value: string): void {
    const input = element.querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }
});

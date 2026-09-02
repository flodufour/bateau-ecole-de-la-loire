import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { Permit } from '../models/permit.model';
import { PermitService } from './permit.service';

describe('PermitService', () => {
  let service: PermitService;
  let httpMock: HttpTestingController;

  const permit: Permit = {
    id: 'a1b2c3',
    name: 'Permis Côtier',
    slug: 'cotier',
    description: "Navigation jusqu'à 6 milles d'un abri",
    price: 450,
    includesTheory: true,
    includesPractical: true,
    isBundle: false,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PermitService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getAll fetches the permit list', () => {
    let result: Permit[] | undefined;
    service.getAll().subscribe((permits) => (result = permits));

    httpMock.expectOne(`${environment.apiUrl}/permits`).flush([permit]);

    expect(result).toEqual([permit]);
  });

  it('getById fetches a single permit', () => {
    let result: Permit | undefined;
    service.getById(permit.id).subscribe((p) => (result = p));

    httpMock.expectOne(`${environment.apiUrl}/permits/${permit.id}`).flush(permit);

    expect(result).toEqual(permit);
  });

  it('create posts the permit input', () => {
    const input = {
      name: permit.name,
      slug: permit.slug,
      description: permit.description,
      price: permit.price,
      includesTheory: permit.includesTheory,
      includesPractical: permit.includesPractical,
      isBundle: permit.isBundle,
    };
    let result: Permit | undefined;
    service.create(input).subscribe((p) => (result = p));

    const req = httpMock.expectOne(`${environment.apiUrl}/permits`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(input);
    req.flush(permit);

    expect(result).toEqual(permit);
  });

  it('update puts the permit input to the given id', () => {
    const input = {
      name: 'Nouveau nom',
      slug: permit.slug,
      description: permit.description,
      price: permit.price,
      includesTheory: permit.includesTheory,
      includesPractical: permit.includesPractical,
      isBundle: permit.isBundle,
    };
    service.update(permit.id, input).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/permits/${permit.id}`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(input);
    req.flush(permit);
  });

  it('delete removes the permit by id', () => {
    let completed = false;
    service.delete(permit.id).subscribe(() => (completed = true));

    const req = httpMock.expectOne(`${environment.apiUrl}/permits/${permit.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(completed).toBeTrue();
  });
});

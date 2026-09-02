import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { Permit } from '../../../core/models/permit.model';
import { PermitDetail } from './permit-detail';

describe('PermitDetail', () => {
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

  function setup(id: string | null): void {
    TestBed.configureTestingModule({
      imports: [PermitDetail],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } },
        },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
  }

  afterEach(() => httpMock.verify());

  it('fetches and renders the permit matching the route id', () => {
    setup(permit.id);
    const fixture = TestBed.createComponent(PermitDetail);
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/permits/${permit.id}`).flush(permit);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Permis Côtier');
  });

  it('shows a not-found message when the id does not match any permit', () => {
    setup(permit.id);
    const fixture = TestBed.createComponent(PermitDetail);
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/permits/${permit.id}`).flush(null, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain("n'existe pas");
  });

  it('shows a not-found message and makes no request when the route has no id', () => {
    setup(null);
    const fixture = TestBed.createComponent(PermitDetail);
    fixture.detectChanges();

    httpMock.expectNone(() => true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain("n'existe pas");
  });
});

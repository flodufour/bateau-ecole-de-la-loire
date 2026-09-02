import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { Permit } from '../../../core/models/permit.model';
import { CatalogList } from './catalog-list';

describe('CatalogList', () => {
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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatalogList],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('renders a card per permit returned by the API', () => {
    const fixture = TestBed.createComponent(CatalogList);
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/permits`).flush([permit]);
    fixture.detectChanges();

    const cards = (fixture.nativeElement as HTMLElement).querySelectorAll('app-permit-card');
    expect(cards.length).toBe(1);
  });

  it('shows an empty-state message when there are no permits', () => {
    const fixture = TestBed.createComponent(CatalogList);
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/permits`).flush([]);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Aucune formation disponible pour le moment.',
    );
  });

  it('shows an error message when the request fails', () => {
    const fixture = TestBed.createComponent(CatalogList);
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/permits`).flush(null, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Impossible de charger');
  });
});

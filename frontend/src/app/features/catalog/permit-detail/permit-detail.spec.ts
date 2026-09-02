import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { CartService } from '../../../core/services/cart.service';
import { Permit } from '../../../core/models/permit.model';
import { PermitDetail } from './permit-detail';

describe('PermitDetail', () => {
  let httpMock: HttpTestingController;
  let cart: CartService;

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
    localStorage.clear();
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
    cart = TestBed.inject(CartService);
  }

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

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

  it('adds one unit to the cart by default', () => {
    setup(permit.id);
    const fixture = TestBed.createComponent(PermitDetail);
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/permits/${permit.id}`).flush(permit);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    element.querySelector<HTMLButtonElement>('button')!.click();
    fixture.detectChanges();

    expect(cart.items()).toEqual([{ permitId: permit.id, permitName: permit.name, price: permit.price, quantity: 1 }]);
    expect(element.textContent).toContain('Ajouté au panier');
  });

  it('adds the chosen quantity to the cart', () => {
    setup(permit.id);
    const fixture = TestBed.createComponent(PermitDetail);
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/permits/${permit.id}`).flush(permit);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const quantityInput = element.querySelector<HTMLInputElement>('input[type="number"]')!;
    quantityInput.value = '3';
    quantityInput.dispatchEvent(new Event('input'));
    element.querySelector<HTMLButtonElement>('button')!.click();

    expect(cart.items()[0].quantity).toBe(3);
  });

  it('is available whether or not the visitor is logged in', () => {
    setup(permit.id);
    const fixture = TestBed.createComponent(PermitDetail);
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/permits/${permit.id}`).flush(permit);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('button')).toBeTruthy();
  });
});

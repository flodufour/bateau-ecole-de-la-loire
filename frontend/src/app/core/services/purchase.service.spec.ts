import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { PermitPurchase } from '../models/permit-purchase.model';
import { PurchaseService } from './purchase.service';

describe('PurchaseService', () => {
  let service: PurchaseService;
  let httpMock: HttpTestingController;

  const purchase: PermitPurchase = {
    id: 'pp1',
    permitId: 'p1',
    permitName: 'Permis Côtier',
    price: 358,
    purchasedAt: '2026-09-02T10:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PurchaseService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('checkout posts the cart items and returns one purchase per unit', () => {
    let result: PermitPurchase[] | undefined;
    service.checkout([{ permitId: purchase.permitId, quantity: 2 }]).subscribe((p) => (result = p));

    const req = httpMock.expectOne(`${environment.apiUrl}/purchases/checkout`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ items: [{ permitId: purchase.permitId, quantity: 2 }] });
    req.flush([purchase, purchase]);

    expect(result).toEqual([purchase, purchase]);
  });

  it('getMine fetches the current user\'s purchases', () => {
    let result: PermitPurchase[] | undefined;
    service.getMine().subscribe((purchases) => (result = purchases));

    httpMock.expectOne(`${environment.apiUrl}/purchases/me`).flush([purchase]);

    expect(result).toEqual([purchase]);
  });

  it('transfer posts the target email', () => {
    let result: PermitPurchase | undefined;
    service.transfer(purchase.id, 'jean.dupont@example.com').subscribe((p) => (result = p));

    const req = httpMock.expectOne(`${environment.apiUrl}/purchases/${purchase.id}/transfer`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'jean.dupont@example.com' });
    req.flush(purchase);

    expect(result).toEqual(purchase);
  });
});

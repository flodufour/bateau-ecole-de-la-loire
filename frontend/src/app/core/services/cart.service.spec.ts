import { TestBed } from '@angular/core/testing';
import { Permit } from '../models/permit.model';
import { CartService } from './cart.service';

describe('CartService', () => {
  let service: CartService;

  const cotier: Permit = {
    id: 'p1',
    name: 'Permis Côtier',
    slug: 'cotier',
    description: 'desc',
    price: 358,
    includesTheory: true,
    includesPractical: true,
    isBundle: false,
  };

  const hauturier: Permit = { ...cotier, id: 'p2', name: 'Permis Hauturier', price: 273 };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(CartService);
  });

  afterEach(() => localStorage.clear());

  it('starts empty', () => {
    expect(service.items()).toEqual([]);
    expect(service.itemCount()).toBe(0);
    expect(service.total()).toBe(0);
  });

  it('adds a permit with the given quantity', () => {
    service.add(cotier, 2);

    expect(service.items()).toEqual([{ permitId: cotier.id, permitName: cotier.name, price: cotier.price, quantity: 2 }]);
    expect(service.itemCount()).toBe(2);
    expect(service.total()).toBe(716);
  });

  it('adding the same permit again increases its quantity instead of duplicating the line', () => {
    service.add(cotier, 1);
    service.add(cotier, 2);

    expect(service.items().length).toBe(1);
    expect(service.items()[0].quantity).toBe(3);
  });

  it('tracks several different permits separately', () => {
    service.add(cotier, 1);
    service.add(hauturier, 2);

    expect(service.itemCount()).toBe(3);
    expect(service.total()).toBe(cotier.price + hauturier.price * 2);
  });

  it('updateQuantity changes the line quantity', () => {
    service.add(cotier, 1);
    service.updateQuantity(cotier.id, 5);

    expect(service.items()[0].quantity).toBe(5);
  });

  it('updateQuantity to zero removes the line', () => {
    service.add(cotier, 1);
    service.updateQuantity(cotier.id, 0);

    expect(service.items()).toEqual([]);
  });

  it('remove drops the line', () => {
    service.add(cotier, 1);
    service.add(hauturier, 1);
    service.remove(cotier.id);

    expect(service.items().map((i) => i.permitId)).toEqual([hauturier.id]);
  });

  it('clear empties the cart', () => {
    service.add(cotier, 1);
    service.clear();

    expect(service.items()).toEqual([]);
  });

  it('persists the cart to localStorage so it survives a reload', () => {
    service.add(cotier, 2);

    expect(JSON.parse(localStorage.getItem('bateau-ecole:cart')!)).toEqual([
      { permitId: cotier.id, permitName: cotier.name, price: cotier.price, quantity: 2 },
    ]);
  });
});

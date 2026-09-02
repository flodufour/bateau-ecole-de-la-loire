import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Permit } from '../../core/models/permit.model';
import { User } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { Cart } from './cart';

describe('Cart', () => {
  let fixture: ComponentFixture<Cart>;
  let element: HTMLElement;
  let httpMock: HttpTestingController;
  let cart: CartService;
  let auth: AuthService;

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

  const student: User = {
    id: 'u1',
    email: 'jean.dupont@example.com',
    firstName: 'Jean',
    lastName: 'Dupont',
    role: 'Student',
  };

  function createComponent(): void {
    fixture = TestBed.createComponent(Cart);
    element = fixture.nativeElement;
    fixture.detectChanges();
  }

  function loginAs(user: User): void {
    auth.login({ email: user.email, password: 'Password123!' }).subscribe();
    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush(user);
  }

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Cart],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    cart = TestBed.inject(CartService);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('shows an empty-state message with a link to the catalog when the cart is empty', () => {
    createComponent();

    expect(element.textContent).toContain('Votre panier est vide');
  });

  it('lists cart items with unit price, quantity, and line total', () => {
    cart.add(cotier, 2);
    createComponent();

    expect(element.textContent).toContain('Permis Côtier');
    expect(element.textContent).toContain('716');
  });

  it('changing the quantity input updates the cart total', () => {
    cart.add(cotier, 1);
    createComponent();

    const input = element.querySelector<HTMLInputElement>('.cart__quantity')!;
    input.value = '4';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(cart.items()[0].quantity).toBe(4);
    expect(element.textContent).toContain('1');
  });

  it('removes a line from the cart', () => {
    cart.add(cotier, 1);
    createComponent();

    element.querySelector<HTMLButtonElement>('.admin-table__actions button')!.click();
    fixture.detectChanges();

    expect(element.textContent).toContain('Votre panier est vide');
  });

  it('shows a login link instead of checkout when logged out', () => {
    cart.add(cotier, 1);
    createComponent();

    expect(element.textContent).toContain('Se connecter pour valider');
    expect(element.querySelector('.cart__checkout')?.tagName).toBe('A');
  });

  it('checks out, clears the cart, and shows a confirmation', () => {
    cart.add(cotier, 2);
    loginAs(student);
    createComponent();

    element.querySelector<HTMLButtonElement>('.cart__checkout')!.click();

    const req = httpMock.expectOne(`${environment.apiUrl}/purchases/checkout`);
    expect(req.request.body).toEqual({ items: [{ permitId: cotier.id, quantity: 2 }] });
    req.flush([
      { id: 'pp1', permitId: cotier.id, permitName: cotier.name, price: cotier.price, purchasedAt: '2026-09-02T10:00:00Z' },
      { id: 'pp2', permitId: cotier.id, permitName: cotier.name, price: cotier.price, purchasedAt: '2026-09-02T10:00:00Z' },
    ]);
    fixture.detectChanges();

    expect(element.textContent).toContain('Commande validée');
    expect(cart.items()).toEqual([]);
  });

  it('shows backend errors when checkout fails', () => {
    cart.add(cotier, 1);
    loginAs(student);
    createComponent();

    element.querySelector<HTMLButtonElement>('.cart__checkout')!.click();

    httpMock
      .expectOne(`${environment.apiUrl}/purchases/checkout`)
      .flush({ errors: ['Un ou plusieurs permis du panier sont introuvables.'] }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();

    expect(element.textContent).toContain('introuvables');
  });

  it('does not allow checkout for a non-Student role', () => {
    cart.add(cotier, 1);
    loginAs({ ...student, role: 'Admin' });
    createComponent();

    expect(element.querySelector('.cart__checkout')).toBeNull();
    expect(element.textContent).toContain('Seul un compte étudiant');
  });
});

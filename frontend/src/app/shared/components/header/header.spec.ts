import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { Permit } from '../../../core/models/permit.model';
import { User } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { Header } from './header';

describe('Header', () => {
  let auth: AuthService;
  let cart: CartService;
  let httpMock: HttpTestingController;

  const user: User = {
    id: 'a1b2c3',
    email: 'jean.dupont@example.com',
    firstName: 'Jean',
    lastName: 'Dupont',
    role: 'Student',
  };

  const permit: Permit = {
    id: 'p1',
    name: 'Permis Côtier',
    slug: 'cotier',
    description: 'desc',
    price: 358,
    includesTheory: true,
    includesPractical: true,
    isBundle: false,
  };

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    auth = TestBed.inject(AuthService);
    cart = TestBed.inject(CartService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
  });

  it('links to the cart and shows no badge when it is empty', () => {
    const fixture = TestBed.createComponent(Header);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Mon panier');
    expect(element.querySelector('.header__cart-badge')).toBeNull();
  });

  it('shows the number of items in the cart badge', () => {
    cart.add(permit, 3);
    const fixture = TestBed.createComponent(Header);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.header__cart-badge')?.textContent?.trim()).toBe('3');
  });

  it('shows "se connecter" / "s\'inscrire" links when logged out', () => {
    const fixture = TestBed.createComponent(Header);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Se connecter');
    expect(text).toContain("S'inscrire");
    expect(text).not.toContain('Se déconnecter');
  });

  it("shows the user's first name and a logout action when logged in", () => {
    auth.login({ email: user.email, password: 'Password123!' }).subscribe();
    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush(user);

    const fixture = TestBed.createComponent(Header);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Jean');
    expect(text).toContain('Se déconnecter');
  });

  it('shows the "Espace moniteur" link for an Instructor', () => {
    const instructor: User = { ...user, role: 'Instructor' };
    auth.login({ email: instructor.email, password: 'Password123!' }).subscribe();
    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush(instructor);

    const fixture = TestBed.createComponent(Header);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Espace moniteur');
  });

  it('shows the "Espace moniteur" link for an Admin too — they may also teach', () => {
    const admin: User = { ...user, role: 'Admin' };
    auth.login({ email: admin.email, password: 'Password123!' }).subscribe();
    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush(admin);

    const fixture = TestBed.createComponent(Header);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Espace moniteur');
  });

  it('does not show the "Espace moniteur" link for a Student', () => {
    auth.login({ email: user.email, password: 'Password123!' }).subscribe();
    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush(user);

    const fixture = TestBed.createComponent(Header);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).not.toContain('Espace moniteur');
  });

  it('is transparent (no "header--scrolled" class) at the top of the page', () => {
    const fixture = TestBed.createComponent(Header);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('header')!.classList).not.toContain(
      'header--scrolled',
    );
  });

  it('gains the "header--scrolled" class once the page is scrolled', () => {
    const fixture = TestBed.createComponent(Header);
    fixture.detectChanges();

    Object.defineProperty(window, 'scrollY', { value: 40, configurable: true });
    window.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('header')!.classList).toContain('header--scrolled');
  });
});

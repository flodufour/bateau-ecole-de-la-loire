import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Home } from './home';

describe('Home', () => {
  let fixture: ComponentFixture<Home>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('shows the boat photo and a short description', () => {
    expect(element.querySelector('img')?.getAttribute('src')).toContain('ecole-conviviale.jpg');
    expect(element.textContent).toContain('Jeanneau Merry Fisher 695');
  });

  it('embeds a map pointing at the school address', () => {
    const iframe = element.querySelector('iframe')!;
    expect(iframe.getAttribute('src')).toContain('44100+Nantes');
  });

  it('links the hero actions to the formations and booking pages', () => {
    const links = Array.from(element.querySelectorAll('.hero__actions a')).map((a) => a.getAttribute('routerLink'));
    expect(links).toEqual(['/formations', '/reserver']);
  });

  it('fades in the below-the-fold sections as they scroll into view', () => {
    const revealed = element.querySelectorAll('.scroll-reveal');
    // "Notre bateau", "Une école à taille humaine", "Candidat libre",
    // "Nous trouver", and the pre-footer CTA band — everything except the
    // hero, which is already visible on load and shouldn't start hidden.
    expect(revealed.length).toBe(5);
  });

  it('mentions the candidat-libre option and links to contact', () => {
    expect(element.textContent).toContain('candidat libre');
    const link = Array.from(element.querySelectorAll('.home-section a')).find(
      (a) => a.getAttribute('routerLink') === '/contact',
    );
    expect(link).toBeTruthy();
  });
});

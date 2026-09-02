import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Footer } from './footer';

describe('Footer', () => {
  let fixture: ComponentFixture<Footer>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Footer],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Footer);
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('links to the legal notice and privacy policy pages', () => {
    const links = Array.from(element.querySelectorAll('.footer__legal a')).map((a) =>
      a.getAttribute('routerLink'),
    );
    expect(links).toEqual(['/mentions-legales', '/politique-de-confidentialite']);
  });
});

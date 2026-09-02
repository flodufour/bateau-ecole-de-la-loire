import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PrivacyPolicy } from './privacy-policy';

describe('PrivacyPolicy', () => {
  let fixture: ComponentFixture<PrivacyPolicy>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrivacyPolicy],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PrivacyPolicy);
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('describes the data actually collected by the app, not generic boilerplate', () => {
    expect(element.textContent).toContain('Réservations');
    expect(element.textContent).toContain('formulaire de contact');
  });

  it("states there is no tracking, matching what's actually in the codebase", () => {
    expect(element.textContent).toContain('Aucun cookie publicitaire');
  });

  it('links to the RGPD rights and the CNIL', () => {
    const cnilLink = element.querySelector('a[href="https://www.cnil.fr"]');
    expect(cnilLink).toBeTruthy();
  });
});

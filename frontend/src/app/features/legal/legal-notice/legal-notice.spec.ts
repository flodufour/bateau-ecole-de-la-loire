import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LegalNotice } from './legal-notice';

describe('LegalNotice', () => {
  let fixture: ComponentFixture<LegalNotice>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LegalNotice],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(LegalNotice);
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  it("shows the site owner's identity and the hosting provider", () => {
    expect(element.textContent).toContain('Bateau École de la Loire');
    expect(element.textContent).toContain('Hetzner Online GmbH');
  });

  it('flags the still-missing legal identity fields rather than inventing them', () => {
    expect(element.textContent).toContain('à compléter');
  });
});

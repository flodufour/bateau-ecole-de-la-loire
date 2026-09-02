import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Permit } from '../../../core/models/permit.model';
import { PermitCard } from './permit-card';

describe('PermitCard', () => {
  const permit: Permit = {
    id: 'a1b2c3',
    name: 'Permis Côtier',
    slug: 'cotier',
    description: "Navigation jusqu'à 6 milles d'un abri",
    price: 450,
    includesTheory: true,
    includesPractical: false,
    isBundle: true,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PermitCard],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('renders the permit name, price, and only the badges that apply', () => {
    const fixture = TestBed.createComponent(PermitCard);
    fixture.componentRef.setInput('permit', permit);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Permis Côtier');
    expect(text).toContain('450');
    expect(text).toContain('Pack');
    expect(text).toContain('Théorie');
    expect(text).not.toContain('Pratique');
  });

  it('links to the permit detail page by id', () => {
    const fixture = TestBed.createComponent(PermitCard);
    fixture.componentRef.setInput('permit', permit);
    fixture.detectChanges();

    const link = (fixture.nativeElement as HTMLElement).querySelector('a');
    expect(link?.getAttribute('href')).toBe('/formations/a1b2c3');
  });
});

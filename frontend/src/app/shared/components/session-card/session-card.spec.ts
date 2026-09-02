import { TestBed } from '@angular/core/testing';
import { Session } from '../../../core/models/session.model';
import { SessionCard } from './session-card';

describe('SessionCard', () => {
  const session: Session = {
    id: 's1',
    permitId: 'p1',
    permitName: 'Permis Côtier',
    instructorId: 'i1',
    instructorName: 'Jean Dupont',
    type: 'Theory',
    startsAt: '2026-09-10T10:00:00Z',
    durationMinutes: 90,
    maxCapacity: 8,
    location: 'Nantes centre',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SessionCard] }).compileComponents();
  });

  it('renders the session details', () => {
    const fixture = TestBed.createComponent(SessionCard);
    fixture.componentRef.setInput('session', session);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Permis Côtier');
    expect(text).toContain('Jean Dupont');
    expect(text).toContain('Nantes centre');
    expect(text).toContain('Théorie');
  });

  it('emits the session id when "Réserver" is clicked', () => {
    const fixture = TestBed.createComponent(SessionCard);
    fixture.componentRef.setInput('session', session);
    fixture.detectChanges();

    let emitted: string | undefined;
    fixture.componentInstance.book.subscribe((id) => (emitted = id));

    (fixture.nativeElement as HTMLElement).querySelector('button')!.click();

    expect(emitted).toBe('s1');
  });

  it('disables the button when disabled is true', () => {
    const fixture = TestBed.createComponent(SessionCard);
    fixture.componentRef.setInput('session', session);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const button = (fixture.nativeElement as HTMLElement).querySelector('button')!;
    expect(button.disabled).toBeTrue();
  });

  it('shows a greyed-out "En attente" button instead of "Réserver" for a Pending booking', () => {
    const fixture = TestBed.createComponent(SessionCard);
    fixture.componentRef.setInput('session', session);
    fixture.componentRef.setInput('bookingStatus', 'Pending');
    fixture.detectChanges();

    const button = (fixture.nativeElement as HTMLElement).querySelector('button')!;
    expect(button.disabled).toBeTrue();
    expect(button.textContent?.trim()).toBe('En attente');
  });

  it('shows a greyed-out "Confirmée" button for a Confirmed booking', () => {
    const fixture = TestBed.createComponent(SessionCard);
    fixture.componentRef.setInput('session', session);
    fixture.componentRef.setInput('bookingStatus', 'Confirmed');
    fixture.detectChanges();

    const button = (fixture.nativeElement as HTMLElement).querySelector('button')!;
    expect(button.disabled).toBeTrue();
    expect(button.textContent?.trim()).toBe('Confirmée');
  });

  it('does not emit book when the session is already booked', () => {
    const fixture = TestBed.createComponent(SessionCard);
    fixture.componentRef.setInput('session', session);
    fixture.componentRef.setInput('bookingStatus', 'Pending');
    fixture.detectChanges();

    let emitted = false;
    fixture.componentInstance.book.subscribe(() => (emitted = true));
    (fixture.nativeElement as HTMLElement).querySelector('button')!.click();

    expect(emitted).toBeFalse();
  });
});

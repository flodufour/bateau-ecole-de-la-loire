import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { WaveBackground } from './wave-background';

describe('WaveBackground', () => {
  let fixture: ComponentFixture<WaveBackground>;
  let element: HTMLElement;
  let originalMatchMedia: typeof window.matchMedia;

  function mockMatchMedia(reducedMotion: boolean): void {
    window.matchMedia = jasmine.createSpy('matchMedia').and.returnValue({
      matches: reducedMotion,
    } as MediaQueryList);
  }

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('renders 4 wave slots', () => {
    mockMatchMedia(false);
    fixture = TestBed.createComponent(WaveBackground);
    fixture.detectChanges();
    element = fixture.nativeElement;

    expect(element.querySelectorAll('.wave').length).toBe(4);
  });

  it('reveals a wave and hides it again after ~2 seconds', fakeAsync(() => {
    mockMatchMedia(false);
    fixture = TestBed.createComponent(WaveBackground);
    fixture.detectChanges();
    element = fixture.nativeElement;

    expect(element.querySelectorAll('.wave--visible').length).toBe(0);

    tick(2500);
    fixture.detectChanges();
    expect(element.querySelectorAll('.wave--visible').length).toBeGreaterThan(0);

    tick(2000);
    fixture.detectChanges();
    expect(element.querySelector('.wave--visible')).toBeNull();

    fixture.destroy();
  }));

  it('never animates when the user prefers reduced motion', fakeAsync(() => {
    mockMatchMedia(true);
    fixture = TestBed.createComponent(WaveBackground);
    fixture.detectChanges();
    element = fixture.nativeElement;

    tick(15000);
    fixture.detectChanges();

    expect(element.querySelectorAll('.wave--visible').length).toBe(0);

    fixture.destroy();
  }));
});

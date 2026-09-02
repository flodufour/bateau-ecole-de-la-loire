import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScrollRevealDirective } from './scroll-reveal.directive';

@Component({
  imports: [ScrollRevealDirective],
  template: `<div appScrollReveal>Contenu</div>`,
})
class HostComponent {}

describe('ScrollRevealDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let observerCallback: IntersectionObserverCallback;
  let disconnectSpy: jasmine.Spy;
  let originalIntersectionObserver: typeof IntersectionObserver;

  beforeEach(async () => {
    disconnectSpy = jasmine.createSpy('disconnect');
    originalIntersectionObserver = window.IntersectionObserver;

    (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver = class {
      constructor(callback: IntersectionObserverCallback) {
        observerCallback = callback;
      }
      observe = jasmine.createSpy('observe');
      disconnect = disconnectSpy;
      unobserve = jasmine.createSpy('unobserve');
    };

    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    window.IntersectionObserver = originalIntersectionObserver;
  });

  function element(): HTMLElement {
    return (fixture.nativeElement as HTMLElement).querySelector('div')!;
  }

  it('is hidden (no "scroll-reveal--visible" class) before it enters the viewport', () => {
    expect(element().classList).not.toContain('scroll-reveal--visible');
  });

  it('reveals the element once it intersects the viewport', () => {
    observerCallback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    fixture.detectChanges();

    expect(element().classList).toContain('scroll-reveal--visible');
  });

  it('stops observing once revealed', () => {
    observerCallback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);

    expect(disconnectSpy).toHaveBeenCalled();
  });

  it('does not reveal the element while it is not intersecting', () => {
    observerCallback([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver);

    expect(element().classList).not.toContain('scroll-reveal--visible');
  });
});

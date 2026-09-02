import { Directive, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';

// Fades an element in (and slides it up slightly) the first time it scrolls
// into view — used on the home page so sections appear one at a time as you
// scroll, instead of all being visible at once. Reveals only once: once
// visible, the element stays visible even if scrolled back out of view.
@Directive({
  selector: '[appScrollReveal]',
  standalone: true,
  host: { class: 'scroll-reveal' },
})
export class ScrollRevealDirective implements OnInit, OnDestroy {
  private readonly element = inject(ElementRef<HTMLElement>);
  private observer?: IntersectionObserver;

  ngOnInit(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.element.nativeElement.classList.add('scroll-reveal--visible');
            this.observer?.disconnect();
          }
        }
      },
      { threshold: 0.15 },
    );
    this.observer.observe(this.element.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}

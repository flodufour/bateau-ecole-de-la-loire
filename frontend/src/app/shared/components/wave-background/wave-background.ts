import { ChangeDetectionStrategy, Component, OnDestroy, signal } from '@angular/core';

interface WaveSlot {
  id: number;
  top: string;
  left: string;
  visible: boolean;
}

const SLOT_COUNT = 4;
const VISIBLE_MS = 2000;
const GAP_MS = 9000;
const GAP_JITTER_MS = 2000;

@Component({
  selector: 'app-wave-background',
  imports: [],
  templateUrl: './wave-background.html',
  styleUrl: './wave-background.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WaveBackground implements OnDestroy {
  private readonly timeouts = new Set<ReturnType<typeof setTimeout>>();

  protected readonly slots = signal<WaveSlot[]>(
    Array.from({ length: SLOT_COUNT }, (_, id) => ({ id, top: '0%', left: '0%', visible: false })),
  );

  constructor() {
    // Purely decorative — skip the whole animation loop for anyone who
    // asked the OS/browser to reduce motion, rather than just hiding it
    // visually with CSS while JS keeps ticking in the background.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    this.slots().forEach((slot, index) => this.scheduleReveal(slot.id, index * 2500));
  }

  private scheduleReveal(id: number, delay: number): void {
    this.runAfter(delay, () => {
      this.updateSlot(id, { ...this.randomPosition(), visible: true });

      this.runAfter(VISIBLE_MS, () => {
        this.updateSlot(id, { visible: false });
        this.scheduleReveal(id, GAP_MS + Math.random() * GAP_JITTER_MS);
      });
    });
  }

  private randomPosition(): { top: string; left: string } {
    return {
      top: `${Math.round(8 + Math.random() * 74)}%`,
      left: `${Math.round(5 + Math.random() * 70)}%`,
    };
  }

  private updateSlot(id: number, patch: Partial<WaveSlot>): void {
    this.slots.update((slots) => slots.map((slot) => (slot.id === id ? { ...slot, ...patch } : slot)));
  }

  private runAfter(delay: number, work: () => void): void {
    const timeout = setTimeout(() => {
      this.timeouts.delete(timeout);
      work();
    }, delay);
    this.timeouts.add(timeout);
  }

  ngOnDestroy(): void {
    this.timeouts.forEach(clearTimeout);
  }
}

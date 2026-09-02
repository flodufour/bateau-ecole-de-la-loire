import { Injectable, computed, signal } from '@angular/core';

// Tracks in-flight HTTP requests so the app shell can show one global loading
// indicator, rather than every component managing its own loading flag.
// See core/interceptors/loading-interceptor.ts, which is what actually
// increments/decrements this.
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly activeRequests = signal(0);

  readonly isLoading = computed(() => this.activeRequests() > 0);

  start(): void {
    this.activeRequests.update((count) => count + 1);
  }

  stop(): void {
    this.activeRequests.update((count) => Math.max(0, count - 1));
  }
}

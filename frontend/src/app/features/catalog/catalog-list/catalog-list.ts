import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Permit } from '../../../core/models/permit.model';
import { PermitService } from '../../../core/services/permit.service';
import { PermitCard } from '../../../shared/components/permit-card/permit-card';

@Component({
  selector: 'app-catalog-list',
  imports: [PermitCard],
  templateUrl: './catalog-list.html',
  styleUrl: './catalog-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogList {
  private readonly permitService = inject(PermitService);

  protected readonly permits = signal<Permit[]>([]);
  protected readonly loaded = signal(false);
  protected readonly failed = signal(false);

  // Decorative ship's-wheel illustration next to the intro text — 8 evenly
  // spaced handles, drawn once and rotated per angle; the whole wheel then
  // spins slowly via a CSS animation (see catalog-list.css).
  protected readonly wheelHandleAngles = [0, 45, 90, 135, 180, 225, 270, 315];

  constructor() {
    this.permitService.getAll().subscribe({
      next: (permits) => {
        this.permits.set(permits);
        this.loaded.set(true);
      },
      error: () => {
        this.failed.set(true);
        this.loaded.set(true);
      },
    });
  }
}

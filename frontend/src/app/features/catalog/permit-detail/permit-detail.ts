import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Permit } from '../../../core/models/permit.model';
import { PermitService } from '../../../core/services/permit.service';

@Component({
  selector: 'app-permit-detail',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './permit-detail.html',
  styleUrl: './permit-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermitDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly permitService = inject(PermitService);

  protected readonly permit = signal<Permit | null>(null);
  protected readonly notFound = signal(false);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.notFound.set(true);
      return;
    }

    this.permitService.getById(id).subscribe({
      next: (permit) => this.permit.set(permit),
      error: () => this.notFound.set(true),
    });
  }
}

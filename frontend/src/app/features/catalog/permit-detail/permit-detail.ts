import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Permit } from '../../../core/models/permit.model';
import { AuthService } from '../../../core/services/auth.service';
import { PermitService } from '../../../core/services/permit.service';
import { PurchaseService } from '../../../core/services/purchase.service';
import { extractApiErrors } from '../../../core/utils/api-error.util';

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
  private readonly purchaseService = inject(PurchaseService);
  private readonly auth = inject(AuthService);

  protected readonly currentUser = this.auth.currentUser;

  protected readonly permit = signal<Permit | null>(null);
  protected readonly notFound = signal(false);

  protected readonly purchasing = signal(false);
  protected readonly purchased = signal(false);
  protected readonly purchaseErrors = signal<string[]>([]);

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

  protected buy(permitId: string): void {
    if (this.purchasing()) return;

    this.purchaseErrors.set([]);
    this.purchasing.set(true);

    this.purchaseService.purchase(permitId).subscribe({
      next: () => {
        this.purchasing.set(false);
        this.purchased.set(true);
      },
      error: (error: unknown) => {
        this.purchasing.set(false);
        this.purchaseErrors.set(extractApiErrors(error));
      },
    });
  }
}

import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Permit } from '../../../core/models/permit.model';
import { CartService } from '../../../core/services/cart.service';
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
  private readonly cartService = inject(CartService);

  protected readonly permit = signal<Permit | null>(null);
  protected readonly notFound = signal(false);

  protected readonly quantity = signal(1);
  protected readonly added = signal(false);

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

  protected setQuantity(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.quantity.set(Number.isFinite(value) && value > 0 ? Math.floor(value) : 1);
  }

  protected addToCart(permit: Permit): void {
    this.cartService.add(permit, this.quantity());
    this.added.set(true);
  }
}

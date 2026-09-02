import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartItem } from '../../core/models/cart-item.model';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { PurchaseService } from '../../core/services/purchase.service';
import { extractApiErrors } from '../../core/utils/api-error.util';

@Component({
  selector: 'app-cart',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Cart {
  private readonly cartService = inject(CartService);
  private readonly purchaseService = inject(PurchaseService);
  private readonly auth = inject(AuthService);

  protected readonly items = this.cartService.items;
  protected readonly total = this.cartService.total;
  protected readonly currentUser = this.auth.currentUser;

  protected readonly checkingOut = signal(false);
  protected readonly checkedOut = signal(false);
  protected readonly errors = signal<string[]>([]);

  protected updateQuantity(item: CartItem, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.cartService.updateQuantity(item.permitId, Number.isFinite(value) ? Math.floor(value) : 0);
  }

  protected remove(item: CartItem): void {
    this.cartService.remove(item.permitId);
  }

  protected checkout(): void {
    if (this.checkingOut() || this.items().length === 0) return;

    this.errors.set([]);
    this.checkingOut.set(true);
    const checkoutItems = this.items().map((item) => ({ permitId: item.permitId, quantity: item.quantity }));

    this.purchaseService.checkout(checkoutItems).subscribe({
      next: () => {
        this.checkingOut.set(false);
        this.checkedOut.set(true);
        this.cartService.clear();
      },
      error: (error: unknown) => {
        this.checkingOut.set(false);
        this.errors.set(extractApiErrors(error));
      },
    });
  }
}

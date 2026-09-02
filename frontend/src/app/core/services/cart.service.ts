import { Injectable, computed, signal } from '@angular/core';
import { CartItem } from '../models/cart-item.model';
import { Permit } from '../models/permit.model';

const STORAGE_KEY = 'bateau-ecole:cart';

// Client-side only — there's no backend "cart" concept, just a checkout
// endpoint that takes a list of { permitId, quantity } (see PurchaseService).
// Persisted to localStorage so it survives a reload; per-browser only, never
// synced across devices or sent anywhere until checkout.
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly itemsSignal = signal<CartItem[]>(readFromStorage());

  readonly items = this.itemsSignal.asReadonly();
  readonly itemCount = computed(() => this.itemsSignal().reduce((sum, item) => sum + item.quantity, 0));
  readonly total = computed(() => this.itemsSignal().reduce((sum, item) => sum + item.price * item.quantity, 0));

  add(permit: Permit, quantity: number): void {
    const existing = this.itemsSignal().find((item) => item.permitId === permit.id);
    const next = existing
      ? this.itemsSignal().map((item) =>
          item.permitId === permit.id ? { ...item, quantity: item.quantity + quantity } : item,
        )
      : [...this.itemsSignal(), { permitId: permit.id, permitName: permit.name, price: permit.price, quantity }];

    this.set(next);
  }

  updateQuantity(permitId: string, quantity: number): void {
    const next =
      quantity <= 0
        ? this.itemsSignal().filter((item) => item.permitId !== permitId)
        : this.itemsSignal().map((item) => (item.permitId === permitId ? { ...item, quantity } : item));

    this.set(next);
  }

  remove(permitId: string): void {
    this.updateQuantity(permitId, 0);
  }

  clear(): void {
    this.set([]);
  }

  private set(items: CartItem[]): void {
    this.itemsSignal.set(items);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Private browsing / storage disabled — the cart just won't survive a reload.
    }
  }
}

function readFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

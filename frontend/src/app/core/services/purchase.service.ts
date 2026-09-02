import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PermitPurchase } from '../models/permit-purchase.model';

export interface CheckoutItem {
  permitId: string;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class PurchaseService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/purchases`;

  // One purchase per unit comes back — a quantity of 3 for one permit
  // returns 3 PermitPurchase rows, each individually transferable later.
  checkout(items: CheckoutItem[]): Observable<PermitPurchase[]> {
    return this.http.post<PermitPurchase[]>(`${this.baseUrl}/checkout`, { items });
  }

  getMine(): Observable<PermitPurchase[]> {
    return this.http.get<PermitPurchase[]>(`${this.baseUrl}/me`);
  }

  transfer(id: string, email: string): Observable<PermitPurchase> {
    return this.http.post<PermitPurchase>(`${this.baseUrl}/${id}/transfer`, { email });
  }
}

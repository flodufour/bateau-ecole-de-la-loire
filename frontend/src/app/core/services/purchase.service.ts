import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PermitPurchase } from '../models/permit-purchase.model';

@Injectable({ providedIn: 'root' })
export class PurchaseService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/purchases`;

  purchase(permitId: string): Observable<PermitPurchase> {
    return this.http.post<PermitPurchase>(this.baseUrl, { permitId });
  }

  getMine(): Observable<PermitPurchase[]> {
    return this.http.get<PermitPurchase[]>(`${this.baseUrl}/me`);
  }

  transfer(id: string, email: string): Observable<PermitPurchase> {
    return this.http.post<PermitPurchase>(`${this.baseUrl}/${id}/transfer`, { email });
  }
}

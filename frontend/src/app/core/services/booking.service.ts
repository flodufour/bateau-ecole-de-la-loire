import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Booking } from '../models/booking.model';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/bookings`;

  getMine(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.baseUrl}/me`);
  }

  create(sessionId: string): Observable<Booking> {
    return this.http.post<Booking>(this.baseUrl, { sessionId });
  }

  cancel(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getAll(): Observable<Booking[]> {
    return this.http.get<Booking[]>(this.baseUrl);
  }

  confirm(id: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/confirm`, null);
  }
}

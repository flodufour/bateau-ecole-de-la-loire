import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Session, SessionType } from '../models/session.model';

export interface SessionFilters {
  type?: SessionType;
  permitId?: string;
  date?: string; // yyyy-MM-dd
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/sessions`;

  getUpcoming(filters: SessionFilters = {}): Observable<Session[]> {
    let params = new HttpParams();
    if (filters.type) params = params.set('type', filters.type);
    if (filters.permitId) params = params.set('permitId', filters.permitId);
    if (filters.date) params = params.set('date', filters.date);

    return this.http.get<Session[]>(this.baseUrl, { params });
  }

  getById(id: string): Observable<Session> {
    return this.http.get<Session>(`${this.baseUrl}/${id}`);
  }
}

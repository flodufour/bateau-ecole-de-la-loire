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

export interface SessionInput {
  permitId: string;
  instructorId: string;
  type: SessionType;
  startsAt: string; // ISO 8601
  durationMinutes: number;
  maxCapacity: number;
  location: string;
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

  create(input: SessionInput): Observable<Session> {
    return this.http.post<Session>(this.baseUrl, input);
  }

  update(id: string, input: SessionInput): Observable<Session> {
    return this.http.put<Session>(`${this.baseUrl}/${id}`, input);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}

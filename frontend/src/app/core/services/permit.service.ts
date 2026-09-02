import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Permit } from '../models/permit.model';

export interface PermitInput {
  name: string;
  slug: string;
  description: string;
  price: number;
  includesTheory: boolean;
  includesPractical: boolean;
  isBundle: boolean;
}

@Injectable({ providedIn: 'root' })
export class PermitService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/permits`;

  getAll(): Observable<Permit[]> {
    return this.http.get<Permit[]>(this.baseUrl);
  }

  getById(id: string): Observable<Permit> {
    return this.http.get<Permit>(`${this.baseUrl}/${id}`);
  }

  create(input: PermitInput): Observable<Permit> {
    return this.http.post<Permit>(this.baseUrl, input);
  }

  update(id: string, input: PermitInput): Observable<Permit> {
    return this.http.put<Permit>(`${this.baseUrl}/${id}`, input);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}

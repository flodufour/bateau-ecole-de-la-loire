import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Permit } from '../models/permit.model';

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
}

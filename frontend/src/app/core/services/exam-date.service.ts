import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ExamDate } from '../models/exam-date.model';

export interface CreateExamDateRequest {
  permitType: string;
  date: string; // yyyy-MM-dd
  location: string;
  notes: string | null;
}

@Injectable({ providedIn: 'root' })
export class ExamDateService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/exam-dates`;

  getUpcoming(): Observable<ExamDate[]> {
    return this.http.get<ExamDate[]>(this.baseUrl);
  }

  create(request: CreateExamDateRequest): Observable<ExamDate> {
    return this.http.post<ExamDate>(this.baseUrl, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}

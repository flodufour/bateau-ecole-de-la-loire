import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Instructor } from '../models/instructor.model';

export interface CreateInstructorRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  bio: string;
  specialties: string[];
}

@Injectable({ providedIn: 'root' })
export class InstructorService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/instructors`;

  getAll(): Observable<Instructor[]> {
    return this.http.get<Instructor[]>(this.baseUrl);
  }

  getById(id: string): Observable<Instructor> {
    return this.http.get<Instructor>(`${this.baseUrl}/${id}`);
  }

  create(request: CreateInstructorRequest): Observable<Instructor> {
    return this.http.post<Instructor>(this.baseUrl, request);
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AvailabilitySlot } from '../models/availability-slot.model';
import { Instructor } from '../models/instructor.model';

export interface CreateInstructorRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  bio: string;
  specialties: string[];
}

export interface CreateAvailabilitySlotRequest {
  startsAt: string; // ISO 8601
  endsAt: string; // ISO 8601
}

@Injectable({ providedIn: 'root' })
export class InstructorService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/instructors`;

  getAll(): Observable<Instructor[]> {
    return this.http.get<Instructor[]>(this.baseUrl);
  }

  getMe(): Observable<Instructor> {
    return this.http.get<Instructor>(`${this.baseUrl}/me`);
  }

  getById(id: string): Observable<Instructor> {
    return this.http.get<Instructor>(`${this.baseUrl}/${id}`);
  }

  create(request: CreateInstructorRequest): Observable<Instructor> {
    return this.http.post<Instructor>(this.baseUrl, request);
  }

  getAvailability(instructorId: string): Observable<AvailabilitySlot[]> {
    return this.http.get<AvailabilitySlot[]>(`${this.baseUrl}/${instructorId}/availability`);
  }

  addAvailability(instructorId: string, request: CreateAvailabilitySlotRequest): Observable<AvailabilitySlot> {
    return this.http.post<AvailabilitySlot>(`${this.baseUrl}/${instructorId}/availability`, request);
  }

  deleteAvailability(instructorId: string, slotId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${instructorId}/availability/${slotId}`);
  }
}

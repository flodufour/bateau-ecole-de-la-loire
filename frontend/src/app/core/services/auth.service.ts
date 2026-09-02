import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Never stores the JWT itself — it lives only in the httpOnly cookie the
// backend sets, which this service (and JS in general) can't read. What we
// hold here is just the *profile* the backend already gave us, as a signal.
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private readonly currentUserSignal = signal<User | null>(null);
  private readonly sessionRestoredSignal = signal(false);

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);
  readonly sessionRestored = this.sessionRestoredSignal.asReadonly();

  // Called once at app startup (see app.config.ts's provideAppInitializer) to
  // find out whether the access_token cookie from a previous visit is still
  // valid — the frontend has no other way to know that after a page reload.
  restoreSession(): Observable<User | null> {
    return this.http.get<User>(`${this.baseUrl}/me`).pipe(
      tap((user) => this.currentUserSignal.set(user)),
      catchError(() => {
        this.currentUserSignal.set(null);
        return of(null);
      }),
      tap(() => this.sessionRestoredSignal.set(true)),
    );
  }

  register(request: RegisterRequest): Observable<User> {
    return this.http
      .post<User>(`${this.baseUrl}/register`, request)
      .pipe(tap((user) => this.currentUserSignal.set(user)));
  }

  login(request: LoginRequest): Observable<User> {
    return this.http
      .post<User>(`${this.baseUrl}/login`, request)
      .pipe(tap((user) => this.currentUserSignal.set(user)));
  }

  logout(): Observable<void> {
    return this.http
      .post<void>(`${this.baseUrl}/logout`, null)
      .pipe(tap(() => this.currentUserSignal.set(null)));
  }

  // Called by the auth-error interceptor when a request comes back 401 — the
  // session died server-side (expired, revoked, deactivated), so local state
  // needs to catch up even though nothing here called logout().
  clearSession(): void {
    this.currentUserSignal.set(null);
  }

  // Always resolves — the backend returns 204 whether or not the email is
  // registered, specifically so this can't be used to enumerate accounts.
  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/forgot-password`, { email });
  }

  resetPassword(email: string, token: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/reset-password`, { email, token, newPassword });
  }
}

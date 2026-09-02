import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

// A 401 from anywhere means the session died server-side (expired token,
// revoked refresh, deactivated account) — clearing local state here means
// the header/guards react immediately instead of showing a stale "logged in"
// UI until the next call happens to fail. Harmless to call on an already-
// logged-out request (a failed login attempt included): clearing null stays null.
export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        auth.clearSession();
      }
      return throwError(() => error);
    }),
  );
};

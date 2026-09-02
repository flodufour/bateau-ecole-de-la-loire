import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// The backend enforces authorization independently (deny-by-default,
// [Authorize(Roles=...)]) — this guard only improves the UX by not rendering
// a page the API would reject anyway. Never the actual security boundary.
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isAuthenticated() ? true : router.parseUrl('/connexion');
};

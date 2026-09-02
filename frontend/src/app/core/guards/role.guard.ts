import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserRole } from '../models/user.model';
import { AuthService } from '../services/auth.service';

// Same caveat as authGuard: a UX nicety, not the security boundary — the
// backend's [Authorize(Roles = "...")] is what actually protects these
// endpoints. A student who bypasses this would just get 403s from the API.
export function roleGuard(role: UserRole): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    const user = auth.currentUser();
    if (!user) return router.parseUrl('/connexion');
    return user.role === role ? true : router.parseUrl('/');
  };
}

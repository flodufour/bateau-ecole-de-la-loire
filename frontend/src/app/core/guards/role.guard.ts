import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserRole } from '../models/user.model';
import { AuthService } from '../services/auth.service';

// Same caveat as authGuard: a UX nicety, not the security boundary — the
// backend's [Authorize(Roles = "...")] is what actually protects these
// endpoints. A student who bypasses this would just get 403s from the API.
//
// Accepts more than one role for routes an Admin also needs (e.g.
// /instructeur, since an Admin who also teaches has no other role to hold —
// see backend/docs/api.md for why this isn't a general multi-role system).
export function roleGuard(roles: UserRole | UserRole[]): CanActivateFn {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    const user = auth.currentUser();
    if (!user) return router.parseUrl('/connexion');
    return allowedRoles.includes(user.role) ? true : router.parseUrl('/');
  };
}

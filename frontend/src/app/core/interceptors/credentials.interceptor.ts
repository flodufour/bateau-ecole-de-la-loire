import { HttpInterceptorFn } from '@angular/common/http';

// The API is on a different origin (different port in dev, a different
// subdomain in prod) — without withCredentials, the browser won't attach our
// httpOnly auth cookies to the request at all, and every call would look
// unauthenticated regardless of whether the user is actually logged in.
export const credentialsInterceptor: HttpInterceptorFn = (req, next) =>
  next(req.clone({ withCredentials: true }));

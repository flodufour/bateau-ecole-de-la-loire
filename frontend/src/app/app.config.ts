import { HttpClient, provideHttpClient, withFetch, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { authErrorInterceptor } from './core/interceptors/auth-error.interceptor';
import { credentialsInterceptor } from './core/interceptors/credentials.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { AuthService } from './core/services/auth.service';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withFetch(),
      // Matches the cookie/header names the backend's antiforgery middleware
      // uses (see backend/src/Program.cs) — nothing to align manually.
      withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' }),
      withInterceptors([credentialsInterceptor, loadingInterceptor, authErrorInterceptor]),
    ),
    // Runs once before the app renders: seeds the XSRF-TOKEN cookie (the
    // interceptor only ever echoes a token that already exists, it can't
    // fetch one) and restores "who's logged in" from the access_token cookie,
    // if any, left over from a previous visit.
    provideAppInitializer(() => {
      const http = inject(HttpClient);
      const auth = inject(AuthService);
      return firstValueFrom(http.get(`${environment.apiUrl}/auth/csrf`, { observe: 'response' })).then(() =>
        firstValueFrom(auth.restoreSession()),
      );
    }),
  ],
};

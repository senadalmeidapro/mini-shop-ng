import {
  HttpContextToken,
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, finalize, shareReplay, switchMap, tap, throwError } from 'rxjs';

import { ENDPOINTS } from '../api/endpoints';
import { Http } from '../api/http';
import { UnauthorizedError, parseApiError } from '../api/errors';
import { AuthService } from '../auth/auth.service';
import { AuthTokens } from '../auth/auth.models';

const RETRIED = new HttpContextToken<boolean>(() => false);

let refresh$: Observable<AuthTokens> | null = null;

function isAuthRequest(url: string): boolean {
  return url.includes('/auth/');
}

function withCredentials(req: HttpRequest<unknown>): HttpRequest<unknown> {
  return req.withCredentials ? req : req.clone({ withCredentials: true });
}

function normalize(error: unknown): unknown {
  return error instanceof HttpErrorResponse ? parseApiError(error) : error;
}

function refreshTokens(auth: AuthService, http: Http): Observable<AuthTokens> {
  const current = refresh$;

  if (current) {
    return current;
  }

  const refreshToken = auth.getRefreshToken();

  if (!refreshToken) {
    return throwError(() => new UnauthorizedError('Session expirée'));
  }

  refresh$ = http.post<AuthTokens>(ENDPOINTS.auth.refresh, { refreshToken }).pipe(
    tap((tokens) => auth.setTokens(tokens)),
    finalize(() => (refresh$ = null)),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  return refresh$;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const http = inject(Http);
  const token = auth.getAccessToken();

  const authorized = isAuthRequest(req.url)
    ? withCredentials(req)
    : withCredentials(
        token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req,
      );

  return next(authorized).pipe(
    catchError((error: unknown) => {
      const unauthorized = error instanceof HttpErrorResponse && error.status === 401;

      if (!unauthorized || authorized.context.get(RETRIED) || isAuthRequest(req.url)) {
        return throwError(() => normalize(error));
      }

      return refreshTokens(auth, http).pipe(
        switchMap((tokens) =>
          next(
            withCredentials(
              req.clone({
                context: req.context.set(RETRIED, true),
                setHeaders: { Authorization: `Bearer ${tokens.accessToken}` },
              }),
            ),
          ),
        ),
        catchError((refreshError: unknown) => {
          auth.clearTokens();
          return throwError(() => normalize(refreshError));
        }),
      );
    }),
  );
};

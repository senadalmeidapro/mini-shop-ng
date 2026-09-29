import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, tap, throwError } from 'rxjs';

import { ENDPOINTS } from '../api/endpoints';
import { TOKEN_STORAGE_KEYS } from '../api/config';
import { Http } from '../api/http';
import { toApiError } from '../api/errors';
import {
  AuthTokens,
  JwtPayload,
  LoginDto,
  LoginResponse,
  RegisterDto,
  Role,
  User,
} from './auth.models';

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const segment = token.split('.')[1];
    if (!segment) {
      return null;
    }
    const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(normalized)) as JwtPayload;
  } catch {
    return null;
  }
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(Http);

  private readonly accessToken = signal<string | null>(readToken(TOKEN_STORAGE_KEYS.ACCESS));
  private readonly refreshToken = signal<string | null>(readToken(TOKEN_STORAGE_KEYS.REFRESH));
  private readonly user = signal<User | null>(null);

  readonly isAuthenticated = computed(() => this.getAccessToken() !== null);

  readonly role = computed<Role | null>(() => {
    const token = this.getAccessToken();
    return token ? (decodeJwtPayload(token)?.role ?? null) : null;
  });

  getAccessToken(): string | null {
    return this.accessToken();
  }

  getRefreshToken(): string | null {
    return this.refreshToken();
  }

  getUser(): User | null {
    return this.user();
  }

  setUser(user: User | null): void {
    this.user.set(user);
  }

  isTokenExpired(token: string | null = this.getAccessToken()): boolean {
    if (!token) {
      return true;
    }

    const exp = decodeJwtPayload(token)?.exp;
    if (!exp) {
      return false;
    }

    return Date.now() >= exp * 1000;
  }

  setTokens(tokens: AuthTokens, user?: User | null): void {
    this.accessToken.set(tokens.accessToken);
    this.refreshToken.set(tokens.refreshToken);
    writeToken(TOKEN_STORAGE_KEYS.ACCESS, tokens.accessToken);
    writeToken(TOKEN_STORAGE_KEYS.REFRESH, tokens.refreshToken);

    if (user !== undefined) {
      this.user.set(user);
    }
  }

  clearTokens(): void {
    this.accessToken.set(null);
    this.refreshToken.set(null);
    this.user.set(null);
    removeToken(TOKEN_STORAGE_KEYS.ACCESS);
    removeToken(TOKEN_STORAGE_KEYS.REFRESH);
  }

  register(dto: RegisterDto): Observable<void> {
    return this.http.post<void>(ENDPOINTS.auth.register, dto).pipe(
      map(() => undefined),
      catchError((error: unknown) => throwError(() => toApiError(error))),
    );
  }

  login(dto: LoginDto): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(ENDPOINTS.auth.login, dto).pipe(
      tap((response) => this.setTokens(response, response.user)),
      catchError((error: unknown) => throwError(() => toApiError(error))),
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(ENDPOINTS.auth.logout).pipe(
      map(() => undefined),
      catchError((error: unknown) => throwError(() => toApiError(error))),
      finalize(() => this.clearTokens()),
    );
  }

  requestPasswordReset(email: string): Observable<void> {
    return this.http.post<void>(ENDPOINTS.auth.resetPasswordRequest, { email }).pipe(
      map(() => undefined),
      catchError((error: unknown) => throwError(() => toApiError(error))),
    );
  }

  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.http.post<void>(ENDPOINTS.auth.resetPassword, { token, newPassword }).pipe(
      map(() => undefined),
      catchError((error: unknown) => throwError(() => toApiError(error))),
    );
  }

  verifyEmail(token: string): Observable<void> {
    return this.http.post<void>(ENDPOINTS.auth.verifyEmail, { token }).pipe(
      map(() => undefined),
      catchError((error: unknown) => throwError(() => toApiError(error))),
    );
  }
}

function readToken(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeToken(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* stockage indisponible (mode privé) */
  }
}

function removeToken(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* stockage indisponible (mode privé) */
  }
}

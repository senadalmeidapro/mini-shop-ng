import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { AuthService } from './auth.service';
import { TOKEN_STORAGE_KEYS } from '../api/config';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('starts unauthenticated', () => {
    expect(service.getAccessToken()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('persists tokens and exposes the role decoded from the JWT', () => {
    const token = `header.${btoa(JSON.stringify({ role: 'admin' }))}.signature`;

    service.setTokens({ accessToken: token, refreshToken: 'refresh' });

    expect(service.getAccessToken()).toBe(token);
    expect(localStorage.getItem(TOKEN_STORAGE_KEYS.ACCESS)).toBe(token);
    expect(localStorage.getItem(TOKEN_STORAGE_KEYS.REFRESH)).toBe('refresh');
    expect(service.role()).toBe('admin');
  });

  it('clears tokens and stored values', () => {
    service.setTokens({ accessToken: 'a', refreshToken: 'b' });

    service.clearTokens();

    expect(service.getAccessToken()).toBeNull();
    expect(localStorage.getItem(TOKEN_STORAGE_KEYS.ACCESS)).toBeNull();
    expect(localStorage.getItem(TOKEN_STORAGE_KEYS.REFRESH)).toBeNull();
  });

  it('detects an expired token', () => {
    const expired = `header.${btoa(JSON.stringify({ exp: 1 }))}.signature`;
    const valid = `header.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))}.signature`;

    expect(service.isTokenExpired(expired)).toBe(true);
    expect(service.isTokenExpired(valid)).toBe(false);
    expect(service.isTokenExpired(null)).toBe(true);
  });
});

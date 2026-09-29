import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ENDPOINTS } from '../../../core/api/endpoints';
import { AuthService } from '../../../core/auth/auth.service';
import { Login } from './login';

function fakeJwt(payload: Record<string, unknown>): string {
  return `header.${btoa(JSON.stringify(payload))}.signature`;
}

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let httpMock: HttpTestingController;
  let auth: AuthService;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not call the API when the form is invalid', () => {
    component.form.setValue({ email: 'nope', password: 'short' });
    component.submit();

    expect(component.form.touched).toBe(true);
    expect(component.loading()).toBe(false);
    httpMock.verify();
  });

  it('stores the tokens returned by the login endpoint', () => {
    const accessToken = fakeJwt({ role: 'user' });

    component.form.setValue({ email: 'user@shop.com', password: 'password123' });
    component.submit();

    const request = httpMock.expectOne(ENDPOINTS.auth.login);
    expect(request.request.body).toEqual({ email: 'user@shop.com', password: 'password123' });
    expect(component.loading()).toBe(true);

    request.flush({
      accessToken,
      refreshToken: 'refresh',
      user: { id: '1', email: 'user@shop.com', role: 'user' },
    });

    expect(auth.getAccessToken()).toBe(accessToken);
    expect(auth.isAuthenticated()).toBe(true);
    expect(component.loading()).toBe(false);
  });

  it('surfaces the API error message', () => {
    component.form.setValue({ email: 'user@shop.com', password: 'password123' });
    component.submit();

    httpMock
      .expectOne(ENDPOINTS.auth.login)
      .flush({ message: 'Identifiants incorrects' }, { status: 401, statusText: 'Unauthorized' });

    expect(component.error()).toBe('Identifiants incorrects');
    expect(auth.isAuthenticated()).toBe(false);
  });
});

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { routes } from './app.routes';
import { TOKEN_STORAGE_KEYS } from './core/api/config';
import { apiInterceptor, authInterceptor } from './core/interceptors';

function setup() {
  TestBed.configureTestingModule({
    providers: [
      provideRouter(routes),
      provideHttpClient(withInterceptors([apiInterceptor, authInterceptor])),
    ],
  });
}

describe('app routes', () => {
  beforeEach(() => localStorage.clear());

  afterEach(() => localStorage.clear());

  it('has a valid configuration', () => {
    setup();
    expect(() => TestBed.inject(Router)).not.toThrow();
  });

  it('renders the register form on /auth/register', async () => {
    setup();
    const harness = await RouterTestingHarness.create('/auth/register');
    await harness.fixture.whenStable();

    const el: HTMLElement = harness.routeNativeElement!;
    expect(el.querySelector('.register__title')?.textContent).toContain('Créer un compte');
    expect(el.querySelectorAll('.register__field input').length).toBe(3);
  });

  it('redirects /auth to /auth/login', async () => {
    setup();
    const harness = await RouterTestingHarness.create('/auth');
    await harness.fixture.whenStable();

    const el: HTMLElement = harness.routeNativeElement!;
    expect(el.querySelector('.login__title')?.textContent).toContain('Se connecter');
  });

  it('renders the auth layout around the register form', async () => {
    setup();
    const harness = await RouterTestingHarness.create('/auth/register');
    await harness.fixture.whenStable();

    expect(document.querySelector('.auth-layout')).toBeTruthy();
    expect(document.querySelector('.auth-layout__card')).toBeTruthy();
    expect(document.querySelector('.register__form')).toBeTruthy();
  });

  it('sends an authenticated visitor away from /auth/login', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEYS.ACCESS, 'header.eyJyb2xlIjoiYWRtaW4ifQ.sig');
    setup();

    const router = TestBed.inject(Router);
    const harness = await RouterTestingHarness.create('/auth/login');
    await harness.fixture.whenStable();

    expect(harness.routeNativeElement?.querySelector('.login__title')).toBeNull();
    expect(router.url).toBe('/');
  });

  it('sends an anonymous visitor away from /admin', async () => {
    setup();
    const router = TestBed.inject(Router);
    await RouterTestingHarness.create('/admin');
    await router.navigateByUrl('/admin');
    await new Promise((resolve) => setTimeout(resolve));

    expect(router.url).toBe('/auth/login?redirect=%2Fadmin');
  });

  it('redirects a non admin away from /admin/products', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEYS.ACCESS, 'header.eyJyb2xlIjoidXNlciJ9.sig');
    localStorage.setItem(TOKEN_STORAGE_KEYS.REFRESH, 'refresh');
    setup();
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/admin/products');
    await new Promise((resolve) => setTimeout(resolve));

    expect(router.url).toBe('/');
  });

  it('renders the supplier dashboard for a user without shop', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEYS.ACCESS, 'header.eyJyb2xlIjoidXNlciJ9.sig');
    localStorage.setItem(TOKEN_STORAGE_KEYS.REFRESH, 'refresh');
    setup();
    const harness = await RouterTestingHarness.create('/supplier');
    await harness.fixture.whenStable();

    expect(harness.routeNativeElement?.querySelector('.saas-card')?.textContent).toContain('boutique');
  });

  it('falls back to the home page on an unknown url', async () => {
    setup();
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/does-not-exist');
    await new Promise((resolve) => setTimeout(resolve));

    expect(router.url).toBe('/');
  });
});

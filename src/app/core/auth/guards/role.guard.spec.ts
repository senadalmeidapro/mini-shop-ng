import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';

import { ENDPOINTS } from '../../api/endpoints';
import { TOKEN_STORAGE_KEYS } from '../../api/config';
import { AuthService } from '../auth.service';
import { SupplierStore } from '../../../features/data-access/supplier.store';
import { adminGuard, supplierGuard } from './role.guard';

function adminToken(): string {
  return 'header.eyJyb2xlIjoiYWRtaW4ifQ.sig';
}

function userToken(): string {
  return 'header.eyJyb2xlIjoidXNlciJ9.sig';
}

function supplierToken(): string {
  return 'header.eyJyb2xlIjoic3VwcGxpZXIifQ.sig';
}

describe('role guards', () => {
  let router: Router;
  let http: HttpTestingController;
  let supplier: SupplierStore;

  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/admin/products' } as RouterStateSnapshot;

  function login(token: string): void {
    localStorage.setItem(TOKEN_STORAGE_KEYS.ACCESS, token);
    localStorage.setItem(TOKEN_STORAGE_KEYS.REFRESH, 'refresh');
  }

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });

    router = TestBed.inject(Router);
    http = TestBed.inject(HttpTestingController);
    supplier = TestBed.inject(SupplierStore);
  });

  afterEach(() => localStorage.clear());

  describe('adminGuard', () => {
    it('redirects an anonymous visitor to the login page with the target url', () => {
      const result = TestBed.runInInjectionContext(() => adminGuard(route, state)) as UrlTree;

      expect(router.serializeUrl(result)).toBe('/auth/login?redirect=%2Fadmin%2Fproducts');
    });

    it('allows an admin', () => {
      login(adminToken());

      expect(TestBed.runInInjectionContext(() => adminGuard(route, state))).toBe(true);
    });

    it('sends a non admin back to the home page', () => {
      login(userToken());

      const result = TestBed.runInInjectionContext(() => adminGuard(route, state)) as UrlTree;

      expect(router.serializeUrl(result)).toBe('/');
    });
  });

  describe('supplierGuard', () => {
    it('redirects an anonymous visitor to the login page', async () => {
      const result = (await TestBed.runInInjectionContext(() =>
        supplierGuard(route, state),
      )) as UrlTree;

      expect(router.serializeUrl(result)).toBe('/auth/login?redirect=%2Fadmin%2Fproducts');
    });

    it('allows an admin and a supplier without loading the shop', async () => {
      login(adminToken());
      await expect(TestBed.runInInjectionContext(() => supplierGuard(route, state))).resolves.toBe(
        true,
      );

      TestBed.resetTestingModule();
      localStorage.clear();
      TestBed.configureTestingModule({
        providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
      });
      router = TestBed.inject(Router);
      http = TestBed.inject(HttpTestingController);
      supplier = TestBed.inject(SupplierStore);
      login(supplierToken());

      await expect(TestBed.runInInjectionContext(() => supplierGuard(route, state))).resolves.toBe(
        true,
      );
      http.verify();
    });

    it('lets a user with a shop through', async () => {
      login(userToken());

      const promise = TestBed.runInInjectionContext(() => supplierGuard(route, state));
      http.expectOne(ENDPOINTS.shops.me).flush({ id: 'sh1', name: 'Demo' });

      await expect(promise).resolves.toBe(true);
      expect(supplier.hasShop()).toBe(true);
    });

    it('sends a user without shop to the supplier onboarding', async () => {
      login(userToken());

      const promise = TestBed.runInInjectionContext(() => supplierGuard(route, state));
      http
        .expectOne(ENDPOINTS.shops.me)
        .flush({ message: 'Introuvable' }, { status: 404, statusText: 'Not Found' });

      await expect(promise).resolves.toBeTruthy();
      expect(router.serializeUrl((await promise) as UrlTree)).toBe('/supplier');
    });
  });
});

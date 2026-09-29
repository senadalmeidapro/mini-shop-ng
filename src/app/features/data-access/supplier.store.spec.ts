import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ENDPOINTS } from '../../core/api/endpoints';
import { Product, SupplierDashboard } from '../../core/models';
import { ToastService } from '../../core/toast/toast.service';
import { SupplierStore } from './supplier.store';

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    categoryId: 'c1',
    name: 'Clavier mécanique',
    description: 'Switches linéaires',
    price: 100,
    stock: 12,
    ...overrides,
  };
}

function dashboard(): SupplierDashboard {
  return {
    shop: { id: 'sh1', name: 'Boutique Demo', slug: 'boutique-demo', isActive: true },
    products: { total: 1, lowStock: [product({ id: 'p2', stock: 1 })] },
    revenue: 1500,
    ordersByStatus: { pending: 2, delivered: 5 },
    recentOrders: [],
    notifications: { unread: 3, recent: [] },
  };
}

describe('SupplierStore', () => {
  let store: SupplierStore;
  let http: HttpTestingController;
  let toast: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    store = TestBed.inject(SupplierStore);
    http = TestBed.inject(HttpTestingController);
    toast = TestBed.inject(ToastService);
  });

  it('starts without a shop, not loaded', () => {
    expect(store.hasShop()).toBe(false);
    expect(store.isLoaded()).toBe(false);
    expect(store.dashboard()).toBeNull();
    expect(store.myProducts()).toEqual([]);
    expect(store.loading()).toBe(false);
  });

  it('flags the shop as present and marks the check as done', () => {
    let result: boolean | undefined;
    store.checkMyShop().subscribe((ok) => (result = ok));

    http.expectOne(ENDPOINTS.shops.me).flush({ id: 'sh1' });

    expect(result).toBe(true);
    expect(store.hasShop()).toBe(true);
    expect(store.isLoaded()).toBe(true);
  });

  it('stays silent and flags no shop on failure', () => {
    let result: boolean | undefined;
    store.checkMyShop().subscribe((ok) => (result = ok));

    http
      .expectOne(ENDPOINTS.shops.me)
      .flush({ message: 'Aucune boutique' }, { status: 404, statusText: 'Not Found' });

    expect(result).toBe(false);
    expect(store.hasShop()).toBe(false);
    expect(store.isLoaded()).toBe(true);
    expect(toast.toasts().length).toBe(0);
  });

  it('loads the dashboard and unlocks the shop area', () => {
    store.getDashboard().subscribe();

    expect(store.loading()).toBe(true);
    http.expectOne(ENDPOINTS.dashboards.supplier).flush(dashboard());

    expect(store.dashboard()?.revenue).toBe(1500);
    expect(store.hasShop()).toBe(true);
    expect(store.isLoaded()).toBe(true);
    expect(store.loading()).toBe(false);
  });

  it('locks the shop area and toasts when the dashboard fails', () => {
    store.getDashboard().subscribe();

    http
      .expectOne(ENDPOINTS.dashboards.supplier)
      .flush({ message: 'Accès refusé' }, { status: 403, statusText: 'Forbidden' });

    expect(store.dashboard()).toBeNull();
    expect(store.hasShop()).toBe(false);
    expect(store.loading()).toBe(false);
    expect(toast.toasts()[0].message).toBe('Accès refusé');
  });

  it('loads my products and resets the loading flag', () => {
    store.getMyProducts().subscribe();

    expect(store.productsLoading()).toBe(true);
    http.expectOne(ENDPOINTS.products.mine).flush([product()]);

    expect(store.myProducts().length).toBe(1);
    expect(store.productsLoading()).toBe(false);
  });

  it('toasts and resets the loading flag when my products fail', () => {
    store.getMyProducts().subscribe();

    http
      .expectOne(ENDPOINTS.products.mine)
      .flush({ message: 'Accès refusé' }, { status: 403, statusText: 'Forbidden' });

    expect(store.myProducts()).toEqual([]);
    expect(store.productsLoading()).toBe(false);
    expect(toast.toasts()[0].message).toBe('Accès refusé');
  });

  it('creates a product from FormData and appends it', () => {
    const body = new FormData();
    body.append('name', 'Clavier mécanique');

    store.createProduct('c1', body).subscribe();

    const request = http.expectOne(ENDPOINTS.products.create('c1'));
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBe(body);
    request.flush(product());

    expect(store.myProducts().length).toBe(1);
    expect(toast.toasts()[0].message).toBe('Produit créé avec succès');
  });

  it('updates a product in the list', () => {
    store.getMyProducts().subscribe();
    http.expectOne(ENDPOINTS.products.mine).flush([product()]);

    const body = new FormData();
    store.updateProduct('p1', body).subscribe();

    const request = http.expectOne(ENDPOINTS.products.update('p1'));
    expect(request.request.method).toBe('PATCH');
    request.flush(product({ name: 'Clavier modéré' }));

    expect(store.myProducts()[0].name).toBe('Clavier modéré');
    expect(toast.toasts()[0].message).toBe('Produit mis à jour');
  });

  it('deletes a product and removes it from the list', () => {
    store.getMyProducts().subscribe();
    http.expectOne(ENDPOINTS.products.mine).flush([product(), product({ id: 'p2' })]);

    store.deleteProduct('p1').subscribe();

    const request = http.expectOne(ENDPOINTS.products.delete('p1'));
    expect(request.request.method).toBe('DELETE');
    request.flush(null);

    expect(store.myProducts().map((item) => item.id)).toEqual(['p2']);
    expect(toast.toasts()[0].message).toBe('Produit supprimé');
  });
});

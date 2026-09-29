import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ENDPOINTS } from '../../core/api/endpoints';
import { Product } from '../../core/models';
import { ToastService } from '../../core/toast/toast.service';
import { ProductStore } from './product.store';

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    categoryId: 'c1',
    name: 'Clavier mécanique',
    description: 'Switches linéaires',
    price: 89.9,
    stock: 12,
    ...overrides,
  };
}

function page<T>(items: T[]) {
  return {
    items,
    page: 1,
    limit: 100,
    total: items.length,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };
}

describe('ProductStore', () => {
  let store: ProductStore;
  let http: HttpTestingController;
  let toast: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    store = TestBed.inject(ProductStore);
    http = TestBed.inject(HttpTestingController);
    toast = TestBed.inject(ToastService);
  });

  it('starts empty and not loading', () => {
    expect(store.products()).toEqual([]);
    expect(store.product()).toBeNull();
    expect(store.isLoading()).toBe(false);
  });

  it('loads the product list', () => {
    let result: Product[] | undefined;

    store.getProducts().subscribe((items) => (result = items));

    const request = http.expectOne((req) => req.url === ENDPOINTS.products.list);
    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('limit')).toBe('100');
    request.flush(page([product(), product({ id: 'p2', name: 'Souris' })]));

    expect(store.products().length).toBe(2);
    expect(store.products()[1].name).toBe('Souris');
    expect(result?.length).toBe(2);
    expect(store.isLoading()).toBe(false);
  });

  it('resets the loading flag on failure', () => {
    store.getProducts().subscribe();
    http
      .expectOne((req) => req.url === ENDPOINTS.products.list)
      .flush('nope', { status: 500, statusText: 'Server Error' });

    expect(store.isLoading()).toBe(false);
    expect(store.products()).toEqual([]);
    expect(toast.toasts()[0].message).toBe('nope');
  });

  it('exposes the selected product', () => {
    store.getProduct('p1').subscribe();

    http.expectOne(ENDPOINTS.products.detail('p1')).flush(product({ name: 'Écran 4K' }));

    expect(store.product()?.name).toBe('Écran 4K');
  });

  it('appends a created product to the list', () => {
    store.createProduct('c1', new FormData()).subscribe();

    const request = http.expectOne(ENDPOINTS.products.create('c1'));
    expect(request.request.body).toBeInstanceOf(FormData);
    request.flush(product({ id: 'p9', name: 'Casque' }));

    expect(store.products().map((item) => item.id)).toEqual(['p9']);
    expect(toast.toasts()[0].message).toBe('Produit créé avec succès');
  });

  it('replaces the updated product in the list and in the selection', () => {
    store.getProducts().subscribe();
    http.expectOne((req) => req.url === ENDPOINTS.products.list).flush(page([product()]));

    store.getProduct('p1').subscribe();
    http.expectOne(ENDPOINTS.products.detail('p1')).flush(product());

    store.updateProduct('p1', new FormData()).subscribe();
    http
      .expectOne(ENDPOINTS.products.update('p1'))
      .flush(product({ name: 'Clavier v2', price: 99 }));

    expect(store.products().length).toBe(1);
    expect(store.products()[0].name).toBe('Clavier v2');
    expect(store.product()?.name).toBe('Clavier v2');
  });

  it('removes a deleted product and clears the selection', () => {
    store.getProduct('p1').subscribe();
    http.expectOne(ENDPOINTS.products.detail('p1')).flush(product());

    store.deleteProduct('p1').subscribe();
    http.expectOne(ENDPOINTS.products.delete('p1')).flush(null);

    expect(store.products()).toEqual([]);
    expect(store.product()).toBeNull();
    expect(toast.toasts()[0].message).toBe('Produit supprimé');
  });

  it('keeps the list untouched when a delete fails', () => {
    store.getProducts().subscribe();
    http.expectOne((req) => req.url === ENDPOINTS.products.list).flush(page([product()]));

    store.deleteProduct('p1').subscribe();
    http
      .expectOne(ENDPOINTS.products.delete('p1'))
      .flush({ message: 'Suppression refusée' }, { status: 403, statusText: 'Forbidden' });

    expect(store.products().length).toBe(1);
    expect(toast.toasts()[0].message).toBe('Suppression refusée');
  });
});

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ENDPOINTS } from '../../core/api/endpoints';
import { Cart, CartItem, Product } from '../../core/models';
import { ToastService } from '../../core/toast/toast.service';
import { CartStore } from './cart.store';

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

function item(quantity: number, overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: 'ci1',
    cartId: 'cart1',
    productId: 'p1',
    product: product(),
    quantity,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function cart(items: CartItem[], id = 'cart1'): Cart {
  return {
    id,
    userId: 'u1',
    cartItems: items,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('CartStore', () => {
  let store: CartStore;
  let http: HttpTestingController;
  let toast: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    store = TestBed.inject(CartStore);
    http = TestBed.inject(HttpTestingController);
    toast = TestBed.inject(ToastService);
  });

  it('starts empty', () => {
    expect(store.cart()).toBeNull();
    expect(store.items()).toEqual([]);
    expect(store.itemCount()).toBe(0);
    expect(store.total()).toBe(0);
  });

  it('computes the count, the per-item totals and the grand total', () => {
    store.getMyCart().subscribe();
    http
      .expectOne(ENDPOINTS.cart.mine)
      .flush(
        cart([
          item(2),
          item(1, { id: 'ci2', productId: 'p2', product: product({ id: 'p2', price: 50 }) }),
        ]),
      );

    expect(store.itemCount()).toBe(3);
    expect(store.totalPerItem().map((line) => line.total)).toEqual([200, 50]);
    expect(store.total()).toBe(250);
  });

  it('loads a cart by id', () => {
    store.getCart('cart9').subscribe();
    http.expectOne(ENDPOINTS.cart.detail('cart9')).flush(cart([item(1)], 'cart9'));

    expect(store.cart()?.id).toBe('cart9');
    expect(store.items().length).toBe(1);
  });

  it('treats a null cart as an empty one', () => {
    store.getMyCart().subscribe();
    http.expectOne(ENDPOINTS.cart.mine).flush(null);

    expect(store.cart()).toBeNull();
    expect(store.items()).toEqual([]);
    expect(store.total()).toBe(0);
  });

  it('adds an item then refreshes the cart', () => {
    let result: boolean | undefined;
    store.addItem('p1', 2).subscribe((ok) => (result = ok));

    const add = http.expectOne(ENDPOINTS.cart.addItem('p1'));
    expect(add.request.method).toBe('POST');
    expect(add.request.body).toEqual({ quantity: 2 });
    add.flush(item(2));

    expect(toast.toasts()[0].message).toBe('Produit ajouté au panier');

    http.expectOne(ENDPOINTS.cart.mine).flush(cart([item(2)]));

    expect(result).toBe(true);
    expect(store.itemCount()).toBe(2);
  });

  it('updates a line from the response payload', () => {
    store.updateItem('ci1', 3).subscribe();
    const request = http.expectOne(ENDPOINTS.cart.updateItem('ci1'));
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ quantity: 3 });
    request.flush(cart([item(3)]));

    expect(store.itemCount()).toBe(3);
  });

  it('removes a line then refreshes the cart', () => {
    store.getMyCart().subscribe();
    http.expectOne(ENDPOINTS.cart.mine).flush(cart([item(1)]));

    store.removeItem('ci1').subscribe();
    const request = http.expectOne(ENDPOINTS.cart.removeItem('ci1'));
    expect(request.request.method).toBe('DELETE');
    request.flush(null);

    expect(toast.toasts()[0].message).toBe('Produit retiré du panier');
    http.expectOne(ENDPOINTS.cart.mine).flush(cart([]));

    expect(store.items()).toEqual([]);
  });

  it('returns false and toasts when adding fails', () => {
    let result: boolean | undefined;
    store.addItem('p1', 1).subscribe((ok) => (result = ok));

    http
      .expectOne(ENDPOINTS.cart.addItem('p1'))
      .flush({ message: 'Stock insuffisant' }, { status: 422, statusText: 'Unprocessable Entity' });

    expect(result).toBe(false);
    expect(toast.toasts()[0].message).toBe('Stock insuffisant');
    expect(store.items()).toEqual([]);
  });

  it('clears the cart', () => {
    store.getMyCart().subscribe();
    http.expectOne(ENDPOINTS.cart.mine).flush(cart([item(1)]));

    store.clearCart();

    expect(store.cart()).toBeNull();
    expect(store.items()).toEqual([]);
    expect(store.total()).toBe(0);
  });
});

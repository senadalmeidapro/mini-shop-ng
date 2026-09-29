import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ENDPOINTS } from '../../core/api/endpoints';
import { Order, Paginate, Product } from '../../core/models';
import { ToastService } from '../../core/toast/toast.service';
import { OrderStore } from './order.store';

function product(): Product {
  return {
    id: 'p1',
    categoryId: 'c1',
    name: 'Clavier mécanique',
    description: 'Switches linéaires',
    price: 100,
    stock: 12,
  };
}

function order(overrides: Partial<Order> = {}): Order {
  return {
    id: 'o1',
    userId: 'u1',
    status: 'pending',
    total: 100,
    trackingNumber: null,
    orderItems: [
      {
        id: 'oi1',
        orderId: 'o1',
        productId: 'p1',
        product: product(),
        quantity: 1,
        unitPrice: 100,
      },
    ],
    ...overrides,
  };
}

function page<T>(items: T[]): Paginate<T> {
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

describe('OrderStore', () => {
  let store: OrderStore;
  let http: HttpTestingController;
  let toast: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    store = TestBed.inject(OrderStore);
    http = TestBed.inject(HttpTestingController);
    toast = TestBed.inject(ToastService);
  });

  it('starts empty', () => {
    expect(store.orders()).toEqual([]);
    expect(store.order()).toBeNull();
  });

  it('unwraps the paginated list', () => {
    store.getOrders().subscribe();

    const request = http.expectOne((req) => req.url === ENDPOINTS.orders.list);
    expect(request.request.params.get('limit')).toBe('100');
    request.flush(page([order(), order({ id: 'o2', status: 'shipped' })]));

    expect(store.orders().length).toBe(2);
  });

  it('toasts when the list fails', () => {
    store.getOrders().subscribe();

    http
      .expectOne((req) => req.url === ENDPOINTS.orders.list)
      .flush({ message: 'Accès refusé' }, { status: 403, statusText: 'Forbidden' });

    expect(store.orders()).toEqual([]);
    expect(toast.toasts()[0].message).toBe('Accès refusé');
  });

  it('stores the current order', () => {
    store.getOrder('o1').subscribe();
    http.expectOne(ENDPOINTS.orders.detail('o1')).flush(order());

    expect(store.order()?.id).toBe('o1');
  });

  it('updates the status in the list, the current order and toasts', () => {
    store.getOrders().subscribe();
    http.expectOne((req) => req.url === ENDPOINTS.orders.list).flush(page([order()]));
    store.getOrder('o1').subscribe();
    http.expectOne(ENDPOINTS.orders.detail('o1')).flush(order());

    store.updateOrder('o1', { status: 'shipped' }).subscribe();

    const request = http.expectOne(ENDPOINTS.orders.update('o1'));
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'shipped' });
    request.flush(order({ status: 'shipped' }));

    expect(store.orders()[0].status).toBe('shipped');
    expect(store.order()?.status).toBe('shipped');
    expect(toast.toasts()[0].message).toBe('Statut mis à jour');
  });

  it('does not toast when only the tracking number changes', () => {
    store.getOrders().subscribe();
    http.expectOne((req) => req.url === ENDPOINTS.orders.list).flush(page([order()]));

    store.updateOrder('o1', { trackingNumber: 'TRK-1' }).subscribe();

    const request = http.expectOne(ENDPOINTS.orders.update('o1'));
    request.flush(order({ trackingNumber: 'TRK-1' }));

    expect(store.orders()[0].trackingNumber).toBe('TRK-1');
    expect(toast.toasts().length).toBe(0);
  });

  it('toasts and keeps the list on update failure', () => {
    store.getOrders().subscribe();
    http.expectOne((req) => req.url === ENDPOINTS.orders.list).flush(page([order()]));

    store.updateOrder('o1', { status: 'cancelled' }).subscribe();

    http
      .expectOne(ENDPOINTS.orders.update('o1'))
      .flush({ message: 'Transition impossible' }, { status: 409, statusText: 'Conflict' });

    expect(store.orders()[0].status).toBe('pending');
    expect(toast.toasts()[0].message).toBe('Transition impossible');
  });

  it('clears the current order', () => {
    store.getOrder('o1').subscribe();
    http.expectOne(ENDPOINTS.orders.detail('o1')).flush(order());

    store.clearCurrent();

    expect(store.order()).toBeNull();
  });
});

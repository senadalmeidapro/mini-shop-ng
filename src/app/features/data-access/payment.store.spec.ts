import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ENDPOINTS } from '../../core/api/endpoints';
import { Paginate, Payment } from '../../core/models';
import { ToastService } from '../../core/toast/toast.service';
import { PaymentStore } from './payment.store';

function payment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: 'pay1',
    orderId: 'o1',
    amount: 100,
    status: 'pending',
    method: 'card',
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

describe('PaymentStore', () => {
  let store: PaymentStore;
  let http: HttpTestingController;
  let toast: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    store = TestBed.inject(PaymentStore);
    http = TestBed.inject(HttpTestingController);
    toast = TestBed.inject(ToastService);
  });

  it('starts empty', () => {
    expect(store.payments()).toEqual([]);
    expect(store.payment()).toBeNull();
  });

  it('unwraps the admin paginated list', () => {
    store.getPayments().subscribe();

    const request = http.expectOne((req) => req.url === ENDPOINTS.payments.list);
    expect(request.request.params.get('limit')).toBe('100');
    request.flush(page([payment()]));

    expect(store.payments().length).toBe(1);
  });

  it('unwraps the current user list', () => {
    store.getMyPayments().subscribe();
    http
      .expectOne((req) => req.url === ENDPOINTS.payments.me)
      .flush(page([payment(), payment({ id: 'pay2' })]));

    expect(store.payments().map((item) => item.id)).toEqual(['pay1', 'pay2']);
  });

  it('toasts when the list fails', () => {
    store.getMyPayments().subscribe();

    http
      .expectOne((req) => req.url === ENDPOINTS.payments.me)
      .flush({ message: 'Accès refusé' }, { status: 403, statusText: 'Forbidden' });

    expect(store.payments()).toEqual([]);
    expect(toast.toasts()[0].message).toBe('Accès refusé');
  });

  it('stores the current payment', () => {
    store.getPayment('pay1').subscribe();
    http.expectOne(ENDPOINTS.payments.detail('pay1')).flush(payment());

    expect(store.payment()?.id).toBe('pay1');
  });

  it('creates a payment for a cart and returns true', () => {
    let result: boolean | undefined;
    store.createPayment('cart1', { method: 'card' }).subscribe((ok) => (result = ok));

    const request = http.expectOne(ENDPOINTS.payments.create('cart1'));
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ method: 'card' });
    request.flush(payment());

    expect(result).toBe(true);
    expect(store.payments().length).toBe(1);
    expect(toast.toasts()[0].message).toBe('Paiement créé avec succès');
  });

  it('returns false and toasts when the creation fails', () => {
    let result: boolean | undefined;
    store.createPayment('cart1', { method: 'paypal' }).subscribe((ok) => (result = ok));

    http
      .expectOne(ENDPOINTS.payments.create('cart1'))
      .flush({ message: 'Carte refusée' }, { status: 402, statusText: 'Payment Required' });

    expect(result).toBe(false);
    expect(toast.toasts()[0].message).toBe('Carte refusée');
    expect(store.payments()).toEqual([]);
  });

  it('updates a payment in the list and the current one', () => {
    store.getPayments().subscribe();
    http.expectOne((req) => req.url === ENDPOINTS.payments.list).flush(page([payment()]));
    store.getPayment('pay1').subscribe();
    http.expectOne(ENDPOINTS.payments.detail('pay1')).flush(payment());

    store.updatePayment('pay1', { status: 'succeeded', method: 'card' }).subscribe();

    const request = http.expectOne(ENDPOINTS.payments.update('pay1'));
    expect(request.request.method).toBe('PATCH');
    request.flush(payment({ status: 'succeeded' }));

    expect(store.payments()[0].status).toBe('succeeded');
    expect(store.payment()?.status).toBe('succeeded');
  });

  it('cancels a payment, removes it and returns true', () => {
    let result: boolean | undefined;
    store.getPayments().subscribe();
    http.expectOne((req) => req.url === ENDPOINTS.payments.list).flush(page([payment()]));
    store.getPayment('pay1').subscribe();
    http.expectOne(ENDPOINTS.payments.detail('pay1')).flush(payment());

    store.cancelPayment('pay1').subscribe((ok) => (result = ok));

    const request = http.expectOne(ENDPOINTS.payments.cancel('pay1'));
    expect(request.request.method).toBe('DELETE');
    request.flush(null);

    expect(result).toBe(true);
    expect(store.payments()).toEqual([]);
    expect(store.payment()).toBeNull();
    expect(toast.toasts()[0].message).toBe('Paiement annulé');
  });

  it('returns false and keeps the payment when the cancel fails', () => {
    let result: boolean | undefined;
    store.getPayments().subscribe();
    http.expectOne((req) => req.url === ENDPOINTS.payments.list).flush(page([payment()]));

    store.cancelPayment('pay1').subscribe((ok) => (result = ok));

    http
      .expectOne(ENDPOINTS.payments.cancel('pay1'))
      .flush({ message: 'Déjà capturé' }, { status: 409, statusText: 'Conflict' });

    expect(result).toBe(false);
    expect(store.payments().length).toBe(1);
    expect(toast.toasts()[0].message).toBe('Déjà capturé');
  });

  it('clears the current payment', () => {
    store.getPayment('pay1').subscribe();
    http.expectOne(ENDPOINTS.payments.detail('pay1')).flush(payment());

    store.clearCurrent();

    expect(store.payment()).toBeNull();
  });
});

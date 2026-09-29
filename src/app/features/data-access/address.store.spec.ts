import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ENDPOINTS } from '../../core/api/endpoints';
import { Address } from '../../core/models';
import { ToastService } from '../../core/toast/toast.service';
import { AddressStore } from './address.store';

function address(overrides: Partial<Address> = {}): Address {
  return {
    id: 'ad1',
    userId: 'u1',
    street: '10 rue Victor Hugo',
    city: 'Paris',
    country: 'France',
    zip: '75003',
    ...overrides,
  };
}

describe('AddressStore', () => {
  let store: AddressStore;
  let http: HttpTestingController;
  let toast: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    store = TestBed.inject(AddressStore);
    http = TestBed.inject(HttpTestingController);
    toast = TestBed.inject(ToastService);
  });

  it('starts empty', () => {
    expect(store.addresses()).toEqual([]);
  });

  it('posts a JSON payload and appends the created address', () => {
    let result: Address | undefined;
    store
      .createAddress({
        street: '10 rue Victor Hugo',
        city: 'Paris',
        country: 'France',
        zip: '75003',
      })
      .subscribe((value) => (result = value));

    const request = http.expectOne(ENDPOINTS.users.address);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      street: '10 rue Victor Hugo',
      city: 'Paris',
      country: 'France',
      zip: '75003',
    });
    request.flush(address());

    expect(result?.id).toBe('ad1');
    expect(store.addresses().length).toBe(1);
    expect(toast.toasts()[0].message).toBe('Adresse enregistrée avec succès');
  });

  it('accepts an address without optional fields', () => {
    store.createAddress({ city: 'Lyon', country: 'France' }).subscribe();

    const request = http.expectOne(ENDPOINTS.users.address);
    expect(request.request.body).toEqual({ city: 'Lyon', country: 'France' });
    request.flush(address({ id: 'ad2', street: undefined, zip: undefined }));
  });

  it('completes without emitting and toasts on error', () => {
    let next = false;
    let complete = false;

    store.createAddress({ city: 'Lyon', country: 'France' }).subscribe({
      next: () => (next = true),
      complete: () => (complete = true),
    });

    http
      .expectOne(ENDPOINTS.users.address)
      .flush({ message: 'Adresse invalide' }, { status: 400, statusText: 'Bad Request' });

    expect(next).toBe(false);
    expect(complete).toBe(true);
    expect(toast.toasts()[0].message).toBe('Adresse invalide');
    expect(store.addresses()).toEqual([]);
  });

  it('clears the stored addresses', () => {
    store.createAddress({ city: 'Lyon', country: 'France' }).subscribe();
    http.expectOne(ENDPOINTS.users.address).flush(address());

    store.clear();

    expect(store.addresses()).toEqual([]);
  });
});

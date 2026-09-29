import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ENDPOINTS } from '../../core/api/endpoints';
import { AuthService } from '../../core/auth/auth.service';
import { Paginate, Product, Shop, ShopDetail, User } from '../../core/models';
import { ToastService } from '../../core/toast/toast.service';
import { ShopStore } from './shop.store';

function user(overrides: Partial<User> = {}): User {
  return {
    id: 'u1',
    email: 'seller@example.com',
    fullName: 'Seller',
    role: 'user',
    ...overrides,
  };
}

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

function shop(overrides: Partial<Shop> = {}): Shop {
  return {
    id: 'sh1',
    ownerId: 'u1',
    name: 'Boutique Demo',
    slug: 'boutique-demo',
    description: 'Une boutique de démo',
    isActive: true,
    ...overrides,
  };
}

function shopDetail(overrides: Partial<ShopDetail> = {}): ShopDetail {
  return {
    ...shop(),
    owner: user(),
    products: [product()],
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

describe('ShopStore', () => {
  let store: ShopStore;
  let http: HttpTestingController;
  let toast: ToastService;
  let auth: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    store = TestBed.inject(ShopStore);
    http = TestBed.inject(HttpTestingController);
    toast = TestBed.inject(ToastService);
    auth = TestBed.inject(AuthService);
  });

  it('starts empty', () => {
    expect(store.shops()).toEqual([]);
    expect(store.shop()).toBeNull();
    expect(store.myShop()).toBeNull();
  });

  it('unwraps the paginated list', () => {
    store.getShops().subscribe();

    const request = http.expectOne((req) => req.url === ENDPOINTS.shops.list);
    expect(request.request.params.get('limit')).toBe('100');
    request.flush(page([shop(), shop({ id: 'sh2', slug: 'autre' })]));

    expect(store.shops().length).toBe(2);
  });

  it('toasts when the list fails', () => {
    store.getShops().subscribe();

    http
      .expectOne((req) => req.url === ENDPOINTS.shops.list)
      .flush({ message: 'Accès refusé' }, { status: 403, statusText: 'Forbidden' });

    expect(store.shops()).toEqual([]);
    expect(toast.toasts()[0].message).toBe('Accès refusé');
  });

  it('stores the current shop detail', () => {
    store.getShop('sh1').subscribe();
    http.expectOne(ENDPOINTS.shops.detail('sh1')).flush(shopDetail());

    expect(store.shop()?.id).toBe('sh1');
    expect(store.shop()?.products.length).toBe(1);
  });

  it('stores my shop', () => {
    store.getMyShop().subscribe();
    http.expectOne(ENDPOINTS.shops.me).flush(shop());

    expect(store.myShop()?.name).toBe('Boutique Demo');
  });

  it('creates a shop and promotes the current user to supplier', () => {
    auth.setUser(user({ role: 'user' }));

    store.createShop({ name: 'Boutique Demo', slug: 'boutique-demo' }).subscribe();

    const request = http.expectOne(ENDPOINTS.shops.create);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ name: 'Boutique Demo', slug: 'boutique-demo' });
    request.flush(shop());

    expect(store.myShop()?.id).toBe('sh1');
    expect(auth.getUser()?.role).toBe('supplier');
    expect(toast.toasts()[0].message).toBe('Boutique créée avec succès');
  });

  it('creates a shop without touching the user when nobody is logged in', () => {
    store.createShop({ name: 'Boutique Demo', slug: 'boutique-demo' }).subscribe();
    http.expectOne(ENDPOINTS.shops.create).flush(shop());

    expect(auth.getUser()).toBeNull();
  });

  it('updates my shop and the public list', () => {
    store.getShops().subscribe();
    http.expectOne((req) => req.url === ENDPOINTS.shops.list).flush(page([shop()]));
    store.getMyShop().subscribe();
    http.expectOne(ENDPOINTS.shops.me).flush(shop());

    store.updateShop('sh1', { name: 'Boutique Renommée', isActive: false }).subscribe();

    const request = http.expectOne(ENDPOINTS.shops.update('sh1'));
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ name: 'Boutique Renommée', isActive: false });
    request.flush(shop({ name: 'Boutique Renommée', isActive: false }));

    expect(store.myShop()?.name).toBe('Boutique Renommée');
    expect(store.shops()[0].name).toBe('Boutique Renommée');
  });

  it('deletes my shop, demotes the supplier and removes it from the list', () => {
    auth.setUser(user({ role: 'supplier' }));
    store.getShops().subscribe();
    http.expectOne((req) => req.url === ENDPOINTS.shops.list).flush(page([shop()]));
    store.getMyShop().subscribe();
    http.expectOne(ENDPOINTS.shops.me).flush(shop());

    store.deleteShop('sh1').subscribe();

    const request = http.expectOne(ENDPOINTS.shops.delete('sh1'));
    expect(request.request.method).toBe('DELETE');
    request.flush(null);

    expect(store.myShop()).toBeNull();
    expect(store.shops()).toEqual([]);
    expect(auth.getUser()?.role).toBe('user');
    expect(toast.toasts()[0].message).toBe('Boutique supprimée');
  });

  it('keeps the supplier role when deleting a shop that is not mine', () => {
    auth.setUser(user({ role: 'supplier' }));
    store.getShops().subscribe();
    http
      .expectOne((req) => req.url === ENDPOINTS.shops.list)
      .flush(page([shop({ ownerId: 'u9' })]));

    store.deleteShop('sh1').subscribe();
    http.expectOne(ENDPOINTS.shops.delete('sh1')).flush(null);

    expect(store.myShop()).toBeNull();
    expect(auth.getUser()?.role).toBe('supplier');
  });

  it('toasts and keeps the shop on delete failure', () => {
    store.getShops().subscribe();
    http.expectOne((req) => req.url === ENDPOINTS.shops.list).flush(page([shop()]));

    store.deleteShop('sh1').subscribe();

    http
      .expectOne(ENDPOINTS.shops.delete('sh1'))
      .flush({ message: 'Commandes en cours' }, { status: 409, statusText: 'Conflict' });

    expect(store.shops().length).toBe(1);
    expect(toast.toasts()[0].message).toBe('Commandes en cours');
  });

  it('clears the current shop', () => {
    store.getShop('sh1').subscribe();
    http.expectOne(ENDPOINTS.shops.detail('sh1')).flush(shopDetail());

    store.clearCurrent();

    expect(store.shop()).toBeNull();
  });
});

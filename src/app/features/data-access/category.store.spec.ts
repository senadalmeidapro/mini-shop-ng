import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ENDPOINTS } from '../../core/api/endpoints';
import { Category, Paginate } from '../../core/models';
import { ToastService } from '../../core/toast/toast.service';
import { CategoryStore } from './category.store';

function category(overrides: Partial<Category> = {}): Category {
  return {
    id: 'c1',
    name: 'Périphériques',
    slug: 'peripheriques',
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

describe('CategoryStore', () => {
  let store: CategoryStore;
  let http: HttpTestingController;
  let toast: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    store = TestBed.inject(CategoryStore);
    http = TestBed.inject(HttpTestingController);
    toast = TestBed.inject(ToastService);
  });

  it('starts empty and idle', () => {
    expect(store.categories()).toEqual([]);
    expect(store.category()).toBeNull();
    expect(store.isLoading()).toBe(false);
  });

  it('unwraps the paginated list', () => {
    store.getCategories().subscribe();

    const request = http.expectOne((req) => req.url === ENDPOINTS.categories.list);
    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('limit')).toBe('100');
    request.flush(page([category(), category({ id: 'c2', slug: 'eclairage' })]));

    expect(store.categories().length).toBe(2);
    expect(store.isLoading()).toBe(false);
  });

  it('clears the loading flag and toasts when the list fails', () => {
    store.getCategories().subscribe();

    http
      .expectOne((req) => req.url === ENDPOINTS.categories.list)
      .flush({ message: 'Accès refusé' }, { status: 403, statusText: 'Forbidden' });

    expect(store.categories()).toEqual([]);
    expect(store.isLoading()).toBe(false);
    expect(toast.toasts()[0].message).toBe('Accès refusé');
  });

  it('stores the current category', () => {
    store.getCategory('c1').subscribe();
    http.expectOne(ENDPOINTS.categories.detail('c1')).flush(category());

    expect(store.category()?.id).toBe('c1');
  });

  it('creates a category with a JSON body and appends it', () => {
    store.createCategory({ name: 'Éclairage', slug: 'eclairage' }).subscribe();

    const request = http.expectOne(ENDPOINTS.categories.create);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ name: 'Éclairage', slug: 'eclairage' });
    request.flush(category({ id: 'c3' }));

    expect(store.categories().map((item) => item.id)).toEqual(['c3']);
    expect(toast.toasts()[0].message).toBe('Catégorie créée avec succès');
  });

  it('replaces the updated category in the list and the current one', () => {
    store.getCategories().subscribe();
    http.expectOne((req) => req.url === ENDPOINTS.categories.list).flush(page([category()]));
    store.getCategory('c1').subscribe();
    http.expectOne(ENDPOINTS.categories.detail('c1')).flush(category());

    store.updateCategory('c1', { name: 'Clavier' }).subscribe();

    const request = http.expectOne(ENDPOINTS.categories.update('c1'));
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ name: 'Clavier' });
    request.flush(category({ name: 'Clavier' }));

    expect(store.categories()[0].name).toBe('Clavier');
    expect(store.category()?.name).toBe('Clavier');
  });

  it('removes the deleted category from the list and clears the current one', () => {
    store.getCategories().subscribe();
    http
      .expectOne((req) => req.url === ENDPOINTS.categories.list)
      .flush(page([category(), category({ id: 'c2' })]));
    store.getCategory('c1').subscribe();
    http.expectOne(ENDPOINTS.categories.detail('c1')).flush(category());

    store.deleteCategory('c1').subscribe();

    const request = http.expectOne(ENDPOINTS.categories.delete('c1'));
    expect(request.request.method).toBe('DELETE');
    request.flush(null);

    expect(store.categories().map((item) => item.id)).toEqual(['c2']);
    expect(store.category()).toBeNull();
    expect(toast.toasts()[0].message).toBe('Catégorie supprimée');
  });

  it('toasts and keeps the list on delete failure', () => {
    store.getCategories().subscribe();
    http.expectOne((req) => req.url === ENDPOINTS.categories.list).flush(page([category()]));

    store.deleteCategory('c1').subscribe();

    http
      .expectOne(ENDPOINTS.categories.delete('c1'))
      .flush({ message: 'Catégorie utilisée' }, { status: 409, statusText: 'Conflict' });

    expect(store.categories().length).toBe(1);
    expect(toast.toasts()[0].message).toBe('Catégorie utilisée');
  });

  it('clears the current category', () => {
    store.getCategory('c1').subscribe();
    http.expectOne(ENDPOINTS.categories.detail('c1')).flush(category());

    store.clearCurrent();

    expect(store.category()).toBeNull();
  });
});

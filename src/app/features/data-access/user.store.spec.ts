import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ENDPOINTS } from '../../core/api/endpoints';
import { Paginate, User } from '../../core/models';
import { ToastService } from '../../core/toast/toast.service';
import { UserStore } from './user.store';

function user(overrides: Partial<User> = {}): User {
  return {
    id: 'u1',
    email: 'alice@example.com',
    fullName: 'Alice',
    role: 'user',
    emailVerified: true,
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

describe('UserStore', () => {
  let store: UserStore;
  let http: HttpTestingController;
  let toast: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    store = TestBed.inject(UserStore);
    http = TestBed.inject(HttpTestingController);
    toast = TestBed.inject(ToastService);
  });

  it('starts empty and idle', () => {
    expect(store.users()).toEqual([]);
    expect(store.user()).toBeNull();
    expect(store.isLoading()).toBe(false);
  });

  it('applies the default pagination when called without params', () => {
    store.getUsers().subscribe();

    const request = http.expectOne((req) => req.url === ENDPOINTS.users.list);
    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('limit')).toBe('100');
    request.flush(page([user()]));

    expect(store.users().length).toBe(1);
    expect(store.isLoading()).toBe(false);
  });

  it('forwards the search, role and active filters', () => {
    store.getUsers({ search: 'ali', page: 2, limit: 10, role: 'admin', active: false }).subscribe();

    const request = http.expectOne((req) => req.url === ENDPOINTS.users.list);
    expect(request.request.params.get('search')).toBe('ali');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('limit')).toBe('10');
    expect(request.request.params.get('role')).toBe('admin');
    expect(request.request.params.get('active')).toBe('false');
    request.flush(page([]));
  });

  it('clears the loading flag and toasts when the list fails', () => {
    store.getUsers().subscribe();

    http
      .expectOne((req) => req.url === ENDPOINTS.users.list)
      .flush({ message: 'Interdit' }, { status: 403, statusText: 'Forbidden' });

    expect(store.users()).toEqual([]);
    expect(store.isLoading()).toBe(false);
    expect(toast.toasts()[0].message).toBe('Interdit');
  });

  it('stores the current user', () => {
    store.getUser('u1').subscribe();
    http.expectOne(ENDPOINTS.users.detail('u1')).flush(user());

    expect(store.user()?.email).toBe('alice@example.com');
  });

  it('creates a user with a JSON body and appends it', () => {
    store
      .createUser({ email: 'bob@example.com', password: 'secret123', fullName: 'Bob' })
      .subscribe();

    const request = http.expectOne(ENDPOINTS.users.create);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      email: 'bob@example.com',
      password: 'secret123',
      fullName: 'Bob',
    });
    request.flush(user({ id: 'u2', email: 'bob@example.com' }));

    expect(store.users().map((item) => item.id)).toEqual(['u2']);
    expect(toast.toasts()[0].message).toBe('Utilisateur créé');
  });

  it('replaces the updated user in the list and the current one', () => {
    store.getUsers().subscribe();
    http.expectOne((req) => req.url === ENDPOINTS.users.list).flush(page([user()]));
    store.getUser('u1').subscribe();
    http.expectOne(ENDPOINTS.users.detail('u1')).flush(user());

    store.updateUser('u1', { fullName: 'Alice B.' }).subscribe();

    const request = http.expectOne(ENDPOINTS.users.update('u1'));
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ fullName: 'Alice B.' });
    request.flush(user({ fullName: 'Alice B.' }));

    expect(store.users()[0].fullName).toBe('Alice B.');
    expect(store.user()?.fullName).toBe('Alice B.');
  });

  it('removes the deleted user and clears the current one', () => {
    store.getUsers().subscribe();
    http
      .expectOne((req) => req.url === ENDPOINTS.users.list)
      .flush(page([user(), user({ id: 'u2' })]));
    store.getUser('u1').subscribe();
    http.expectOne(ENDPOINTS.users.detail('u1')).flush(user());

    store.deleteUser('u1').subscribe();

    const request = http.expectOne(ENDPOINTS.users.delete('u1'));
    expect(request.request.method).toBe('DELETE');
    request.flush(null);

    expect(store.users().map((item) => item.id)).toEqual(['u2']);
    expect(store.user()).toBeNull();
    expect(toast.toasts()[0].message).toBe('Utilisateur supprimé');
  });

  it('toasts and keeps the list on delete failure', () => {
    store.getUsers().subscribe();
    http.expectOne((req) => req.url === ENDPOINTS.users.list).flush(page([user()]));

    store.deleteUser('u1').subscribe();

    http
      .expectOne(ENDPOINTS.users.delete('u1'))
      .flush({ message: 'Suppression impossible' }, { status: 409, statusText: 'Conflict' });

    expect(store.users().length).toBe(1);
    expect(toast.toasts()[0].message).toBe('Suppression impossible');
  });

  it('clears the current user', () => {
    store.getUser('u1').subscribe();
    http.expectOne(ENDPOINTS.users.detail('u1')).flush(user());

    store.clearCurrent();

    expect(store.user()).toBeNull();
  });
});

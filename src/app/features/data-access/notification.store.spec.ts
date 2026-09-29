import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ENDPOINTS } from '../../core/api/endpoints';
import { Notification } from '../../core/models';
import { ToastService } from '../../core/toast/toast.service';
import { NotificationStore } from './notification.store';

function notification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: 'n1',
    userId: 'u1',
    type: 'new_order',
    title: 'Nouvelle commande',
    message: 'La commande #1 a été passée',
    read: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function page<T>(items: T[]) {
  return {
    items,
    page: 1,
    limit: 50,
    total: items.length,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };
}

describe('NotificationStore', () => {
  let store: NotificationStore;
  let http: HttpTestingController;
  let toast: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    store = TestBed.inject(NotificationStore);
    http = TestBed.inject(HttpTestingController);
    toast = TestBed.inject(ToastService);
  });

  it('starts empty', () => {
    expect(store.notifications()).toEqual([]);
    expect(store.unreadCount()).toBe(0);
  });

  it('loads the list then refreshes the unread count', () => {
    let result: Notification[] | undefined;
    store.getNotifications().subscribe((items) => (result = items));

    const request = http.expectOne((req) => req.url === ENDPOINTS.notifications.list);
    expect(request.request.params.get('limit')).toBe('50');
    request.flush(page([notification(), notification({ id: 'n2', read: true })]));

    expect(store.notifications().length).toBe(2);

    http.expectOne(ENDPOINTS.notifications.unreadCount).flush(1);

    expect(store.unreadCount()).toBe(1);
    expect(result?.length).toBe(2);
  });

  it('still exposes the list when the unread count request fails', () => {
    store.getNotifications().subscribe();
    http.expectOne((req) => req.url === ENDPOINTS.notifications.list).flush(page([notification()]));
    http
      .expectOne(ENDPOINTS.notifications.unreadCount)
      .flush('boom', { status: 500, statusText: 'Server Error' });

    expect(store.notifications().length).toBe(1);
    expect(store.unreadCount()).toBe(0);
  });

  it('reports a failure of the list request', () => {
    store.getNotifications().subscribe();
    http
      .expectOne((req) => req.url === ENDPOINTS.notifications.list)
      .flush(
        { message: 'Notifications indisponibles' },
        { status: 500, statusText: 'Server Error' },
      );

    expect(store.notifications()).toEqual([]);
    expect(toast.toasts()[0].message).toBe('Notifications indisponibles');
  });

  it('decrements the unread count when a notification is read', () => {
    store.getNotifications().subscribe();
    http.expectOne((req) => req.url === ENDPOINTS.notifications.list).flush(page([notification()]));
    http.expectOne(ENDPOINTS.notifications.unreadCount).flush(1);

    store.markAsRead('n1').subscribe();
    http.expectOne(ENDPOINTS.notifications.read('n1')).flush(null);

    expect(store.notifications()[0].read).toBe(true);
    expect(store.unreadCount()).toBe(0);
  });

  it('never lets the unread count go below zero', () => {
    store.getNotifications().subscribe();
    http.expectOne((req) => req.url === ENDPOINTS.notifications.list).flush(page([notification()]));
    http.expectOne(ENDPOINTS.notifications.unreadCount).flush(0);

    store.markAsRead('n1').subscribe();
    http.expectOne(ENDPOINTS.notifications.read('n1')).flush(null);

    expect(store.unreadCount()).toBe(0);
  });

  it('marks every notification as read', () => {
    store.getNotifications().subscribe();
    http
      .expectOne((req) => req.url === ENDPOINTS.notifications.list)
      .flush(page([notification(), notification({ id: 'n2' })]));
    http.expectOne(ENDPOINTS.notifications.unreadCount).flush(2);

    store.markAllAsRead().subscribe();
    http.expectOne(ENDPOINTS.notifications.readAll).flush(null);

    expect(store.notifications().every((item) => item.read)).toBe(true);
    expect(store.unreadCount()).toBe(0);
    expect(toast.toasts()[0].message).toBe('Toutes les notifications sont marquées comme lues');
  });
});

import { Injectable, inject, signal } from '@angular/core';
import { EMPTY, Observable, catchError, map, switchMap, tap } from 'rxjs';

import { ENDPOINTS } from '../../core/api/endpoints';
import { Http } from '../../core/api/http';
import { Notification, Paginate } from '../../core/models';
import { ToastService } from '../../core/toast/toast.service';

@Injectable({ providedIn: 'root' })
export class NotificationStore {
  private readonly http = inject(Http);
  private readonly toast = inject(ToastService);

  private readonly list = signal<Notification[]>([]);
  private readonly unread = signal(0);

  readonly notifications = this.list.asReadonly();
  readonly unreadCount = this.unread.asReadonly();

  getNotifications(): Observable<Notification[]> {
    return this.http
      .get<Paginate<Notification>>(ENDPOINTS.notifications.list, { params: { page: 1, limit: 50 } })
      .pipe(
        map((response) => response.items),
        tap((items) => this.list.set(items)),
        switchMap((items) => this.refreshUnreadCount().pipe(map(() => items))),
        catchError((error: unknown) => {
          this.toast.apiError(error, 'Impossible de charger les notifications');
          return EMPTY;
        }),
      );
  }

  refreshUnreadCount(): Observable<number> {
    return this.http.get<number>(ENDPOINTS.notifications.unreadCount).pipe(
      tap((count) => this.unread.set(count)),
      catchError(() => EMPTY),
    );
  }

  markAsRead(id: string): Observable<void> {
    return this.http.patch<void>(ENDPOINTS.notifications.read(id)).pipe(
      tap(() => {
        const target = this.list().find((notification) => notification.id === id);

        if (target && !target.read) {
          this.list.update((list) =>
            list.map((notification) =>
              notification.id === id ? { ...notification, read: true } : notification,
            ),
          );
          this.unread.update((count) => Math.max(0, count - 1));
        }
      }),
      catchError((error: unknown) => {
        this.toast.apiError(error, 'Impossible de marquer la notification comme lue');
        return EMPTY;
      }),
    );
  }

  markAllAsRead(): Observable<void> {
    return this.http.patch<void>(ENDPOINTS.notifications.readAll).pipe(
      tap(() => {
        this.list.update((list) => list.map((notification) => ({ ...notification, read: true })));
        this.unread.set(0);
        this.toast.success('Toutes les notifications sont marquées comme lues');
      }),
      catchError((error: unknown) => {
        this.toast.apiError(error, 'Impossible de marquer les notifications comme lues');
        return EMPTY;
      }),
    );
  }
}

import { Injectable, inject, signal } from '@angular/core';
import { EMPTY, Observable, catchError, map, tap } from 'rxjs';

import { ENDPOINTS } from '../../core/api/endpoints';
import { Http } from '../../core/api/http';
import { Order, OrderStatus, Paginate } from '../../core/models';
import { ToastService } from '../../core/toast/toast.service';

export interface UpdateOrderDto {
  status?: OrderStatus;
  trackingNumber?: string;
}

@Injectable({ providedIn: 'root' })
export class OrderStore {
  private readonly http = inject(Http);
  private readonly toast = inject(ToastService);

  private readonly current = signal<Order | null>(null);
  private readonly list = signal<Order[]>([]);

  readonly orders = this.list.asReadonly();
  readonly order = this.current.asReadonly();

  getOrders(): Observable<Order[]> {
    return this.http
      .get<Paginate<Order>>(ENDPOINTS.orders.list, { params: { page: 1, limit: 100 } })
      .pipe(
        map((response) => response.items),
        tap((items) => this.list.set(items)),
        catchError((error: unknown) => {
          this.toast.apiError(error, 'Impossible de charger les commandes');
          return EMPTY;
        }),
      );
  }

  getOrder(id: string): Observable<Order> {
    return this.http.get<Order>(ENDPOINTS.orders.detail(id)).pipe(
      tap((order) => this.current.set(order)),
      catchError((error: unknown) => {
        this.toast.apiError(error, 'Impossible de charger la commande');
        return EMPTY;
      }),
    );
  }

  updateOrder(id: string, data: UpdateOrderDto): Observable<Order> {
    return this.http.patch<Order>(ENDPOINTS.orders.update(id), data).pipe(
      tap((order) => {
        this.list.update((orders) => orders.map((item) => (item.id === id ? order : item)));

        if (this.current()?.id === id) {
          this.current.set(order);
        }

        if (data.status) {
          this.toast.success('Statut mis à jour');
        }
      }),
      catchError((error: unknown) => {
        this.toast.apiError(error, 'Impossible de mettre à jour la commande');
        return EMPTY;
      }),
    );
  }

  clearCurrent(): void {
    this.current.set(null);
  }
}

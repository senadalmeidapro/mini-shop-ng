import { Injectable, inject, signal } from '@angular/core';
import { EMPTY, Observable, catchError, map, of, tap } from 'rxjs';

import { ENDPOINTS } from '../../core/api/endpoints';
import { Http } from '../../core/api/http';
import {
  Paginate,
  Payment,
  PaymentMethod,
  PaymentStatus,
  ShippingAddress,
} from '../../core/models';
import { ToastService } from '../../core/toast/toast.service';

export interface PaymentDto {
  status?: Exclude<PaymentStatus, 'cancelled'>;
  method: PaymentMethod;
  shippingAddress?: ShippingAddress;
}

@Injectable({ providedIn: 'root' })
export class PaymentStore {
  private readonly http = inject(Http);
  private readonly toast = inject(ToastService);

  private readonly current = signal<Payment | null>(null);
  private readonly list = signal<Payment[]>([]);

  readonly payments = this.list.asReadonly();
  readonly payment = this.current.asReadonly();

  getPayments(): Observable<Payment[]> {
    return this.http
      .get<Paginate<Payment>>(ENDPOINTS.payments.list, { params: { page: 1, limit: 100 } })
      .pipe(
        map((response) => response.items),
        tap((items) => this.list.set(items)),
        catchError((error: unknown) => {
          this.toast.apiError(error, 'Impossible de charger les paiements');
          return EMPTY;
        }),
      );
  }

  getMyPayments(): Observable<Payment[]> {
    return this.http
      .get<Paginate<Payment>>(ENDPOINTS.payments.me, { params: { page: 1, limit: 100 } })
      .pipe(
        map((response) => response.items),
        tap((items) => this.list.set(items)),
        catchError((error: unknown) => {
          this.toast.apiError(error, 'Impossible de charger vos paiements');
          return EMPTY;
        }),
      );
  }

  getPayment(id: string): Observable<Payment> {
    return this.http.get<Payment>(ENDPOINTS.payments.detail(id)).pipe(
      tap((payment) => this.current.set(payment)),
      catchError((error: unknown) => {
        this.toast.apiError(error, 'Impossible de charger le paiement');
        return EMPTY;
      }),
    );
  }

  createPayment(cartId: string, data: PaymentDto): Observable<boolean> {
    return this.http.post<Payment>(ENDPOINTS.payments.create(cartId), data).pipe(
      tap((payment) => {
        this.list.update((payments) => [...payments, payment]);
        this.toast.success('Paiement créé avec succès');
      }),
      map(() => true),
      catchError((error: unknown) => {
        this.toast.apiError(error, 'Impossible de créer le paiement');
        return of(false);
      }),
    );
  }

  updatePayment(id: string, data: PaymentDto): Observable<Payment> {
    return this.http.patch<Payment>(ENDPOINTS.payments.update(id), data).pipe(
      tap((payment) => {
        this.list.update((payments) => payments.map((item) => (item.id === id ? payment : item)));

        if (this.current()?.id === id) {
          this.current.set(payment);
        }
      }),
      catchError((error: unknown) => {
        this.toast.apiError(error, 'Impossible de mettre à jour le paiement');
        return EMPTY;
      }),
    );
  }

  cancelPayment(id: string): Observable<boolean> {
    return this.http.delete<void>(ENDPOINTS.payments.cancel(id)).pipe(
      tap(() => {
        this.list.update((payments) => payments.filter((payment) => payment.id !== id));

        if (this.current()?.id === id) {
          this.current.set(null);
        }

        this.toast.success('Paiement annulé');
      }),
      map(() => true),
      catchError((error: unknown) => {
        this.toast.apiError(error, "Impossible d'annuler le paiement");
        return of(false);
      }),
    );
  }

  clearCurrent(): void {
    this.current.set(null);
  }
}

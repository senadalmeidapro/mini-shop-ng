import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, finalize, forkJoin, tap } from 'rxjs';

import { ENDPOINTS } from '../../../../core/api/endpoints';
import { ToastService } from '../../../../core/toast/toast.service';
import { OrderStore } from '../../../data-access/order.store';
import { PaymentStore } from '../../../data-access/payment.store';
import { ProductStore } from '../../../data-access/product.store';

@Component({
  selector: 'app-order-list',
  imports: [DatePipe, DecimalPipe, NgClass],
  styleUrl: './order-list.scss',
  templateUrl: './order-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderList implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly orderStore = inject(OrderStore);
  private readonly paymentStore = inject(PaymentStore);
  private readonly productStore = inject(ProductStore);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly orders = this.orderStore.orders;
  protected readonly downloadingOrderId = signal<string | null>(null);

  protected readonly paymentByOrder = computed(() => {
    const map = new Map<string, string>();

    for (const payment of this.paymentStore.payments()) {
      map.set(payment.orderId, payment.id);
    }

    return map;
  });

  protected readonly statusLabels: Record<string, string> = {
    pending: 'En attente',
    confirmed: 'Confirmée',
    shipped: 'Expédiée',
    delivered: 'Livrée',
    cancelled: 'Annulée',
    completed: 'Terminée',
  };

  ngOnInit(): void {
    this.orderStore.getOrders().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.paymentStore.getMyPayments().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  protected statusLabel(status: string): string {
    return this.statusLabels[status] ?? status;
  }

  protected statusTone(status: string): string {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'confirmed':
      case 'shipped':
        return 'info';
      case 'delivered':
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'danger';
      default:
        return 'neutral';
    }
  }

  protected cancelOrder(orderId: string): void {
    const paymentId = this.paymentByOrder().get(orderId);

    if (!paymentId) {
      return;
    }

    this.paymentStore
      .cancelPayment(paymentId)
      .pipe(
        tap((ok) => {
          if (ok) {
            this.syncAfterCancel();
          }
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected downloadInvoice(orderId: string): void {
    this.downloadingOrderId.set(orderId);

    this.http
      .get(ENDPOINTS.orders.invoice(orderId), { responseType: 'blob' })
      .pipe(
        tap((blob) => this.saveFile(blob, `facture-${orderId}.pdf`)),
        catchError((error: unknown) => {
          this.toast.apiError(error, 'Impossible de télécharger la facture');
          return EMPTY;
        }),
        finalize(() => this.downloadingOrderId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private syncAfterCancel(): void {
    forkJoin([
      this.orderStore.getOrders(),
      this.paymentStore.getMyPayments(),
      this.productStore.getProducts(),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  private saveFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }
}

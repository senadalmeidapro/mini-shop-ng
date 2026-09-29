import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { finalize, forkJoin, tap } from 'rxjs';

import { AuthService } from '../../../../core/auth/auth.service';
import { CartStore } from '../../../data-access/cart.store';
import { NotificationStore } from '../../../data-access/notification.store';
import { OrderStore } from '../../../data-access/order.store';
import { PaymentStore } from '../../../data-access/payment.store';
import { ProductStore } from '../../../data-access/product.store';

@Component({
  selector: 'app-cart-list',
  imports: [DecimalPipe, RouterLink],
  styleUrl: './cart-list.scss',
  templateUrl: './cart-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartList {
  private readonly cartStore = inject(CartStore);
  private readonly paymentStore = inject(PaymentStore);
  private readonly orderStore = inject(OrderStore);
  private readonly productStore = inject(ProductStore);
  private readonly notificationStore = inject(NotificationStore);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly items = this.cartStore.totalPerItem;
  protected readonly itemCount = this.cartStore.itemCount;
  protected readonly total = this.cartStore.total;
  protected readonly paying = signal(false);

  protected increase(itemId: string, quantity: number): void {
    this.cartStore
      .updateItem(itemId, quantity + 1)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  protected decrease(itemId: string, quantity: number): void {
    if (quantity > 1) {
      this.cartStore
        .updateItem(itemId, quantity - 1)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe();
    }
  }

  protected remove(itemId: string): void {
    this.cartStore.removeItem(itemId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  protected pay(): void {
    const cartId = this.cartStore.cart()?.id;

    if (!cartId || this.paying()) {
      return;
    }

    this.paying.set(true);

    this.paymentStore
      .createPayment(cartId, {
        method: 'card',
        shippingAddress: {
          fullName: this.auth.getUser()?.fullName ?? 'Client',
        },
      })
      .pipe(
        tap((ok) => {
          if (ok) {
            this.syncAfterCheckout();
          }
        }),
        finalize(() => this.paying.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private syncAfterCheckout(): void {
    forkJoin([
      this.cartStore.getMyCart(),
      this.productStore.getProducts(),
      this.orderStore.getOrders(),
      this.paymentStore.getMyPayments(),
      this.notificationStore.refreshUnreadCount(),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }
}

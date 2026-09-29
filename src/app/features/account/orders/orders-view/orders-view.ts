import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { CartStore } from '../../../data-access/cart.store';
import { CartList } from '../cart-list/cart-list';
import { OrderList } from '../order-list/order-list';
import { OrdersNav } from '../orders-nav/orders-nav';

@Component({
  selector: 'app-orders-view',
  imports: [CartList, OrderList, OrdersNav],
  styleUrl: './orders-view.scss',
  templateUrl: './orders-view.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersView implements OnInit {
  private readonly cartStore = inject(CartStore);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly tab = signal<'cart' | 'orders'>('cart');

  ngOnInit(): void {
    this.cartStore.getMyCart().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }
}

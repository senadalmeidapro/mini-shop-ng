import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';

import { CartStore } from '../../../data-access/cart.store';

@Component({
  selector: 'app-orders-nav',
  imports: [],
  styleUrl: './orders-nav.scss',
  templateUrl: './orders-nav.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersNav {
  readonly active = input<'cart' | 'orders'>('cart');
  readonly tabChange = output<'cart' | 'orders'>();

  private readonly cartStore = inject(CartStore);

  protected readonly itemCount = this.cartStore.itemCount;

  protected select(tab: 'cart' | 'orders'): void {
    this.tabChange.emit(tab);
  }
}

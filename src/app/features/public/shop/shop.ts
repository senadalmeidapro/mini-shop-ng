import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { ProductStore } from '../../data-access/product.store';
import { ShopStore } from '../../data-access/shop.store';

@Component({
  selector: 'app-shop',
  imports: [NgClass, RouterLink],
  styleUrl: './shop.scss',
  templateUrl: './shop.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shop implements OnInit {
  private readonly shopStore = inject(ShopStore);
  private readonly productStore = inject(ProductStore);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly shops = this.shopStore.shops;

  protected readonly productCountByShop = computed(() => {
    const counts = new Map<string, number>();

    for (const product of this.productStore.products()) {
      if (!product.shopId) {
        continue;
      }

      counts.set(product.shopId, (counts.get(product.shopId) ?? 0) + 1);
    }

    return counts;
  });

  ngOnInit(): void {
    this.shopStore.getShops().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.productStore.getProducts().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  protected productCount(shopId: string): number {
    return this.productCountByShop().get(shopId) ?? 0;
  }

  protected revealDelay(index: number): number {
    return Math.min(index + 1, 6);
  }
}

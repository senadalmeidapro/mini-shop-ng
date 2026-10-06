import { DecimalPipe } from '@angular/common';
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
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { API_CONFIG } from '../../../core/api/config';
import { AuthService } from '../../../core/auth/auth.service';
import { Product } from '../../../core/models';
import { ToastService } from '../../../core/toast/toast.service';
import { CartStore } from '../../data-access/cart.store';
import { ProductStore } from '../../data-access/product.store';

@Component({
  selector: 'app-home',
  imports: [DecimalPipe, RouterLink],
  styleUrl: './home.scss',
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly productStore = inject(ProductStore);
  private readonly cartStore = inject(CartStore);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly apiBaseUrl = API_CONFIG.baseURL;
  protected readonly skeletonCards = [1, 2, 3, 4, 5, 6, 7, 8];
  protected readonly cartLoading = signal<Record<string, boolean>>({});
  protected readonly productsLoading = this.productStore.isLoading;

  protected readonly features = [
    {
      icon: 'truck',
      title: 'Livraison rapide',
      text: 'Expédition sous 24h pour tous les produits disponibles en stock.',
    },
    {
      icon: 'shield',
      title: 'Paiement sécurisé',
      text: 'Transactions chiffrées et protégées pour une tranquillité totale.',
    },
    {
      icon: 'support',
      title: 'Support 7j/7',
      text: 'Une équipe à votre écoute pour répondre à toutes vos questions.',
    },
  ];

  protected readonly featuredProducts = computed(() =>
    this.productStore
      .products()
      .filter((product) => product.stock > 0)
      .slice(0, 5),
  );

  ngOnInit(): void {
    if (this.productStore.products().length) {
      return;
    }

    this.productStore.getProducts().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  protected addToCart(event: Event, product: Product): void {
    event.stopPropagation();

    if (!this.auth.getAccessToken()) {
      this.toast.warning('Connectez-vous pour ajouter au panier.');
      return;
    }

    this.setCartLoading(product.id, true);

    this.cartStore
      .addItem(product.id, 1)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.setCartLoading(product.id, false)),
      )
      .subscribe((added) => {
        if (added) {
          this.refreshProducts();
        }
      });
  }

  private refreshProducts(): void {
    this.productStore.getProducts().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  private setCartLoading(productId: string, loading: boolean): void {
    this.cartLoading.update((state) => ({ ...state, [productId]: loading }));
  }
}

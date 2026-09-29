import { Injectable, computed, inject, signal } from '@angular/core';
import { EMPTY, Observable, catchError, defaultIfEmpty, map, of, switchMap, tap } from 'rxjs';

import { ENDPOINTS } from '../../core/api/endpoints';
import { Http } from '../../core/api/http';
import { Cart, CartItem } from '../../core/models';
import { ToastService } from '../../core/toast/toast.service';

@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly http = inject(Http);
  private readonly toast = inject(ToastService);

  private readonly current = signal<Cart | null>(null);
  private readonly lines = signal<CartItem[]>([]);

  readonly cart = this.current.asReadonly();
  readonly items = this.lines.asReadonly();

  readonly itemCount = computed(() => this.lines().reduce((sum, item) => sum + item.quantity, 0));

  readonly totalPerItem = computed(() =>
    this.lines().map((item) => ({ ...item, total: item.quantity * item.product.price })),
  );

  readonly total = computed(() =>
    this.lines().reduce((sum, item) => sum + item.quantity * item.product.price, 0),
  );

  getCart(id: string): Observable<Cart> {
    return this.http.get<Cart>(ENDPOINTS.cart.detail(id)).pipe(
      tap((cart) => this.setCart(cart)),
      catchError((error: unknown) => {
        this.toast.apiError(error, 'Impossible de charger le panier');
        return EMPTY;
      }),
    );
  }

  getMyCart(): Observable<Cart | null> {
    return this.http.get<Cart | null>(ENDPOINTS.cart.mine).pipe(
      tap((cart) => this.setCart(cart)),
      catchError((error: unknown) => {
        this.toast.apiError(error, 'Impossible de charger le panier');
        return EMPTY;
      }),
    );
  }

  addItem(productId: string, quantity: number): Observable<boolean> {
    return this.http.post<CartItem>(ENDPOINTS.cart.addItem(productId), { quantity }).pipe(
      tap(() => this.toast.success('Produit ajouté au panier')),
      switchMap(() => this.refresh()),
      catchError((error: unknown) => {
        this.toast.apiError(error, "Impossible d'ajouter le produit");
        return of(false);
      }),
    );
  }

  updateItem(id: string, quantity: number): Observable<boolean> {
    return this.http.patch<Cart>(ENDPOINTS.cart.updateItem(id), { quantity }).pipe(
      tap((cart) => this.setCart(cart)),
      map(() => true),
      catchError((error: unknown) => {
        this.toast.apiError(error, 'Impossible de mettre à jour le panier');
        return of(false);
      }),
    );
  }

  removeItem(id: string): Observable<boolean> {
    return this.http.delete<void>(ENDPOINTS.cart.removeItem(id)).pipe(
      tap(() => this.toast.success('Produit retiré du panier')),
      switchMap(() => this.refresh()),
      catchError((error: unknown) => {
        this.toast.apiError(error, 'Impossible de retirer le produit');
        return of(false);
      }),
    );
  }

  clearCart(): void {
    this.current.set(null);
    this.lines.set([]);
  }

  private refresh(): Observable<boolean> {
    return this.getMyCart().pipe(
      defaultIfEmpty(null),
      map(() => true),
    );
  }

  private setCart(cart: Cart | null): void {
    this.current.set(cart);
    this.lines.set(cart?.cartItems ?? []);
  }
}

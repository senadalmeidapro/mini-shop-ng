import { Injectable, inject, signal } from '@angular/core';
import { EMPTY, Observable, catchError, finalize, map, of, tap } from 'rxjs';

import { ENDPOINTS } from '../../core/api/endpoints';
import { Http } from '../../core/api/http';
import { Product, Shop, SupplierDashboard } from '../../core/models';
import { ToastService } from '../../core/toast/toast.service';

@Injectable({ providedIn: 'root' })
export class SupplierStore {
  private readonly http = inject(Http);
  private readonly toast = inject(ToastService);

  private readonly dashboardState = signal<SupplierDashboard | null>(null);
  private readonly products = signal<Product[]>([]);
  private readonly dashboardLoading = signal(false);
  private readonly productsLoadingState = signal(false);
  private readonly shopState = signal(false);
  private readonly loadedState = signal(false);

  readonly dashboard = this.dashboardState.asReadonly();
  readonly myProducts = this.products.asReadonly();
  readonly loading = this.dashboardLoading.asReadonly();
  readonly productsLoading = this.productsLoadingState.asReadonly();
  readonly hasShop = this.shopState.asReadonly();
  readonly isLoaded = this.loadedState.asReadonly();

  checkMyShop(): Observable<boolean> {
    this.loadedState.set(true);

    return this.http.get<Shop>(ENDPOINTS.shops.me).pipe(
      map(() => true),
      tap(() => this.shopState.set(true)),
      catchError(() => {
        this.shopState.set(false);
        return of(false);
      }),
    );
  }

  getDashboard(): Observable<SupplierDashboard> {
    this.dashboardLoading.set(true);

    return this.http.get<SupplierDashboard>(ENDPOINTS.dashboards.supplier).pipe(
      tap((dashboard) => {
        this.dashboardState.set(dashboard);
        this.shopState.set(true);
        this.loadedState.set(true);
      }),
      catchError((error: unknown) => {
        this.toast.apiError(error, 'Impossible de charger le tableau de bord fournisseur');
        this.dashboardState.set(null);
        this.shopState.set(false);
        this.loadedState.set(true);
        return EMPTY;
      }),
      finalize(() => this.dashboardLoading.set(false)),
    );
  }

  getMyProducts(): Observable<Product[]> {
    this.productsLoadingState.set(true);

    return this.http.get<Product[]>(ENDPOINTS.products.mine).pipe(
      tap((products) => this.products.set(products)),
      catchError((error: unknown) => {
        this.toast.apiError(error, 'Impossible de charger vos produits');
        return EMPTY;
      }),
      finalize(() => this.productsLoadingState.set(false)),
    );
  }

  createProduct(categoryId: string, data: FormData): Observable<Product> {
    return this.http.post<Product>(ENDPOINTS.products.create(categoryId), data).pipe(
      tap((product) => {
        this.products.update((products) => [...products, product]);
        this.toast.success('Produit créé avec succès');
      }),
      catchError((error: unknown) => {
        this.toast.apiError(error, 'Impossible de créer le produit');
        return EMPTY;
      }),
    );
  }

  updateProduct(id: string, data: FormData): Observable<Product> {
    return this.http.patch<Product>(ENDPOINTS.products.update(id), data).pipe(
      tap((product) => {
        this.products.update((products) =>
          products.map((item) => (item.id === id ? product : item)),
        );
        this.toast.success('Produit mis à jour');
      }),
      catchError((error: unknown) => {
        this.toast.apiError(error, 'Impossible de mettre à jour le produit');
        return EMPTY;
      }),
    );
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(ENDPOINTS.products.delete(id)).pipe(
      tap(() => {
        this.products.update((products) => products.filter((product) => product.id !== id));
        this.toast.success('Produit supprimé');
      }),
      catchError((error: unknown) => {
        this.toast.apiError(error, 'Impossible de supprimer le produit');
        return EMPTY;
      }),
    );
  }
}

import { Injectable, inject, signal } from '@angular/core';
import { EMPTY, Observable, catchError, finalize, map, tap } from 'rxjs';

import { ENDPOINTS } from '../../core/api/endpoints';
import { Http } from '../../core/api/http';
import { Product, Paginate } from '../../core/models';
import { ToastService } from '../../core/toast/toast.service';

@Injectable({ providedIn: 'root' })
export class ProductStore {
  private readonly http = inject(Http);
  private readonly toast = inject(ToastService);

  private readonly list = signal<Product[]>([]);
  private readonly selected = signal<Product | null>(null);
  private readonly loading = signal(false);

  readonly products = this.list.asReadonly();
  readonly product = this.selected.asReadonly();
  readonly isLoading = this.loading.asReadonly();

  getProducts(): Observable<Product[]> {
    this.loading.set(true);

    return this.http
      .get<Paginate<Product>>(ENDPOINTS.products.list, { params: { page: 1, limit: 100 } })
      .pipe(
        map((response) => response.items),
        tap((items) => this.list.set(items)),
        catchError((error: unknown) => {
          this.toast.apiError(error, 'Impossible de charger les produits');
          return EMPTY;
        }),
        finalize(() => this.loading.set(false)),
      );
  }

  getProduct(id: string): Observable<Product> {
    return this.http.get<Product>(ENDPOINTS.products.detail(id)).pipe(
      tap((product) => this.selected.set(product)),
      catchError((error: unknown) => {
        this.toast.apiError(error, 'Impossible de charger le produit');
        return EMPTY;
      }),
    );
  }

  createProduct(categoryId: string, data: FormData): Observable<Product> {
    return this.http.post<Product>(ENDPOINTS.products.create(categoryId), data).pipe(
      tap((product) => {
        this.list.update((products) => [...products, product]);
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
        this.list.update((products) => products.map((item) => (item.id === id ? product : item)));

        if (this.selected()?.id === id) {
          this.selected.set(product);
        }
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
        this.list.update((products) => products.filter((product) => product.id !== id));

        if (this.selected()?.id === id) {
          this.selected.set(null);
        }

        this.toast.success('Produit supprimé');
      }),
      catchError((error: unknown) => {
        this.toast.apiError(error, 'Impossible de supprimer le produit');
        return EMPTY;
      }),
    );
  }

  clearSelected(): void {
    this.selected.set(null);
  }
}

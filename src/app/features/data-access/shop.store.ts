import { Injectable, inject, signal } from '@angular/core';
import { EMPTY, Observable, catchError, map, tap } from 'rxjs';

import { ENDPOINTS } from '../../core/api/endpoints';
import { Http } from '../../core/api/http';
import { AuthService } from '../../core/auth/auth.service';
import { Paginate, Shop, ShopDetail } from '../../core/models';
import { ToastService } from '../../core/toast/toast.service';

export interface CreateShopDto {
  name: string;
  slug: string;
  description?: string;
}

export interface UpdateShopDto {
  name?: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ShopStore {
  private readonly http = inject(Http);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  private readonly current = signal<ShopDetail | null>(null);
  private readonly list = signal<Shop[]>([]);
  private readonly mine = signal<Shop | null>(null);

  readonly shops = this.list.asReadonly();
  readonly shop = this.current.asReadonly();
  readonly myShop = this.mine.asReadonly();

  getShops(): Observable<Shop[]> {
    return this.http
      .get<Paginate<Shop>>(ENDPOINTS.shops.list, { params: { page: 1, limit: 100 } })
      .pipe(
        map((response) => response.items),
        tap((items) => this.list.set(items)),
        catchError((error: unknown) => {
          this.toast.apiError(error, 'Impossible de charger les boutiques');
          return EMPTY;
        }),
      );
  }

  getShop(id: string): Observable<ShopDetail> {
    return this.http.get<ShopDetail>(ENDPOINTS.shops.detail(id)).pipe(
      tap((shop) => this.current.set(shop)),
      catchError((error: unknown) => {
        this.toast.apiError(error, 'Impossible de charger la boutique');
        return EMPTY;
      }),
    );
  }

  getMyShop(): Observable<Shop> {
    return this.http.get<Shop>(ENDPOINTS.shops.me).pipe(
      tap((shop) => this.mine.set(shop)),
      catchError((error: unknown) => {
        this.toast.apiError(error, 'Impossible de charger votre boutique');
        return EMPTY;
      }),
    );
  }

  createShop(data: CreateShopDto): Observable<Shop> {
    return this.http.post<Shop>(ENDPOINTS.shops.create, data).pipe(
      tap((shop) => {
        this.mine.set(shop);

        const user = this.auth.getUser();
        if (user) {
          this.auth.setUser({ ...user, role: 'supplier' });
        }

        this.toast.success('Boutique créée avec succès');
      }),
      catchError((error: unknown) => {
        this.toast.apiError(error, 'Impossible de créer la boutique');
        return EMPTY;
      }),
    );
  }

  updateShop(id: string, data: UpdateShopDto): Observable<Shop> {
    return this.http.patch<Shop>(ENDPOINTS.shops.update(id), data).pipe(
      tap((shop) => {
        if (this.mine()?.id === id) {
          this.mine.set(shop);
        }

        this.list.update((shops) => shops.map((item) => (item.id === id ? shop : item)));
      }),
      catchError((error: unknown) => {
        this.toast.apiError(error, 'Impossible de mettre à jour la boutique');
        return EMPTY;
      }),
    );
  }

  deleteShop(id: string): Observable<void> {
    return this.http.delete<void>(ENDPOINTS.shops.delete(id)).pipe(
      tap(() => {
        if (this.mine()?.id === id) {
          this.mine.set(null);

          const user = this.auth.getUser();
          if (user?.role === 'supplier') {
            this.auth.setUser({ ...user, role: 'user' });
          }
        }

        this.list.update((shops) => shops.filter((shop) => shop.id !== id));
        this.toast.success('Boutique supprimée');
      }),
      catchError((error: unknown) => {
        this.toast.apiError(error, 'Impossible de supprimer la boutique');
        return EMPTY;
      }),
    );
  }

  clearCurrent(): void {
    this.current.set(null);
  }
}

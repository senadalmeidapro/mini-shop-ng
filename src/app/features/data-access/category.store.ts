import { Injectable, inject, signal } from '@angular/core';
import { EMPTY, Observable, catchError, finalize, map, tap } from 'rxjs';

import { ENDPOINTS } from '../../core/api/endpoints';
import { Http } from '../../core/api/http';
import { Category, Paginate } from '../../core/models';
import { ToastService } from '../../core/toast/toast.service';

export interface CreateCategoryDto {
  name: string;
  slug: string;
}

export interface UpdateCategoryDto {
  name?: string;
  slug?: string;
}

@Injectable({ providedIn: 'root' })
export class CategoryStore {
  private readonly http = inject(Http);
  private readonly toast = inject(ToastService);

  private readonly current = signal<Category | null>(null);
  private readonly list = signal<Category[]>([]);
  private readonly loading = signal<boolean>(false);

  readonly categories = this.list.asReadonly();
  readonly category = this.current.asReadonly();
  readonly isLoading = this.loading.asReadonly();

  getCategories(): Observable<Category[]> {
    this.loading.set(true);

    return this.http
      .get<Paginate<Category>>(ENDPOINTS.categories.list, { params: { page: 1, limit: 100 } })
      .pipe(
        map((response) => response.items),
        tap((items) => this.list.set(items)),
        catchError((error: unknown) => {
          this.toast.apiError(error, 'Impossible de charger les catégories');
          return EMPTY;
        }),
        finalize(() => this.loading.set(false)),
      );
  }

  getCategory(id: string): Observable<Category> {
    return this.http.get<Category>(ENDPOINTS.categories.detail(id)).pipe(
      tap((category) => this.current.set(category)),
      catchError((error: unknown) => {
        this.toast.apiError(error, 'Impossible de charger la catégorie');
        return EMPTY;
      }),
    );
  }

  createCategory(data: CreateCategoryDto): Observable<Category> {
    return this.http.post<Category>(ENDPOINTS.categories.create, data).pipe(
      tap((category) => {
        this.list.update((categories) => [...categories, category]);
        this.toast.success('Catégorie créée avec succès');
      }),
      catchError((error: unknown) => {
        this.toast.apiError(error, 'Impossible de créer la catégorie');
        return EMPTY;
      }),
    );
  }

  updateCategory(id: string, data: UpdateCategoryDto): Observable<Category> {
    return this.http.patch<Category>(ENDPOINTS.categories.update(id), data).pipe(
      tap((category) => {
        this.list.update((categories) =>
          categories.map((item) => (item.id === id ? category : item)),
        );

        if (this.current()?.id === id) {
          this.current.set(category);
        }
      }),
      catchError((error: unknown) => {
        this.toast.apiError(error, 'Impossible de mettre à jour la catégorie');
        return EMPTY;
      }),
    );
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(ENDPOINTS.categories.delete(id)).pipe(
      tap(() => {
        this.list.update((categories) => categories.filter((category) => category.id !== id));

        if (this.current()?.id === id) {
          this.current.set(null);
        }

        this.toast.success('Catégorie supprimée');
      }),
      catchError((error: unknown) => {
        this.toast.apiError(error, 'Impossible de supprimer la catégorie');
        return EMPTY;
      }),
    );
  }

  clearCurrent(): void {
    this.current.set(null);
  }
}

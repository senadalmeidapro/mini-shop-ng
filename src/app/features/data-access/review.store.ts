import { Injectable, inject, signal } from '@angular/core';
import { EMPTY, Observable, catchError, map, tap } from 'rxjs';

import { ENDPOINTS } from '../../core/api/endpoints';
import { Http } from '../../core/api/http';
import { Paginate, Review } from '../../core/models';
import { ToastService } from '../../core/toast/toast.service';

export interface CreateReviewDto {
  rating: number;
  comment?: string;
}

export interface UpdateReviewDto {
  rating?: number;
  comment?: string;
}

@Injectable({ providedIn: 'root' })
export class ReviewStore {
  private readonly http = inject(Http);
  private readonly toast = inject(ToastService);

  private readonly current = signal<Review | null>(null);
  private readonly list = signal<Review[]>([]);

  readonly reviews = this.list.asReadonly();
  readonly review = this.current.asReadonly();

  getReviews(): Observable<Review[]> {
    return this.http
      .get<Paginate<Review>>(ENDPOINTS.reviews.list, { params: { page: 1, limit: 100 } })
      .pipe(
        map((response) => response.items),
        tap((items) => this.list.set(items)),
        catchError((error: unknown) => {
          this.toast.apiError(error, 'Impossible de charger les avis');
          return EMPTY;
        }),
      );
  }

  getReview(id: string): Observable<Review> {
    return this.http.get<Review>(ENDPOINTS.reviews.detail(id)).pipe(
      tap((review) => this.current.set(review)),
      catchError((error: unknown) => {
        this.toast.apiError(error, "Impossible de charger l'avis");
        return EMPTY;
      }),
    );
  }

  createReview(productId: string, data: CreateReviewDto): Observable<Review> {
    return this.http.post<Review>(ENDPOINTS.reviews.create(productId), data).pipe(
      tap((review) => {
        this.list.update((reviews) => [...reviews, review]);
        this.toast.success('Avis créé avec succès');
      }),
      catchError((error: unknown) => {
        this.toast.apiError(error, "Impossible de créer l'avis");
        return EMPTY;
      }),
    );
  }

  updateReview(id: string, data: UpdateReviewDto): Observable<Review> {
    return this.http.patch<Review>(ENDPOINTS.reviews.update(id), data).pipe(
      tap((review) => {
        this.list.update((reviews) => reviews.map((item) => (item.id === id ? review : item)));

        if (this.current()?.id === id) {
          this.current.set(review);
        }
      }),
      catchError((error: unknown) => {
        this.toast.apiError(error, "Impossible de mettre à jour l'avis");
        return EMPTY;
      }),
    );
  }

  deleteReview(id: string): Observable<void> {
    return this.http.delete<void>(ENDPOINTS.reviews.delete(id)).pipe(
      tap(() => {
        this.list.update((reviews) => reviews.filter((review) => review.id !== id));

        if (this.current()?.id === id) {
          this.current.set(null);
        }

        this.toast.success('Avis supprimé');
      }),
      catchError((error: unknown) => {
        this.toast.apiError(error, "Impossible de supprimer l'avis");
        return EMPTY;
      }),
    );
  }

  clearCurrent(): void {
    this.current.set(null);
  }
}

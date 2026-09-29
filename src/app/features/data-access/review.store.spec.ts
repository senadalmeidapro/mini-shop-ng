import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ENDPOINTS } from '../../core/api/endpoints';
import { Paginate, Product, Review, User } from '../../core/models';
import { ToastService } from '../../core/toast/toast.service';
import { ReviewStore } from './review.store';

function user(overrides: Partial<User> = {}): User {
  return {
    id: 'u1',
    email: 'alice@example.com',
    fullName: 'Alice',
    role: 'user',
    ...overrides,
  };
}

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    categoryId: 'c1',
    name: 'Clavier mécanique',
    description: 'Switches linéaires',
    price: 100,
    stock: 12,
    ...overrides,
  };
}

function review(overrides: Partial<Review> = {}): Review {
  return {
    id: 'r1',
    userId: 'u1',
    user: user(),
    productId: 'p1',
    product: product(),
    rating: 5,
    comment: 'Excellent produit',
    ...overrides,
  };
}

function page<T>(items: T[]): Paginate<T> {
  return {
    items,
    page: 1,
    limit: 100,
    total: items.length,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };
}

describe('ReviewStore', () => {
  let store: ReviewStore;
  let http: HttpTestingController;
  let toast: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    store = TestBed.inject(ReviewStore);
    http = TestBed.inject(HttpTestingController);
    toast = TestBed.inject(ToastService);
  });

  it('starts empty', () => {
    expect(store.reviews()).toEqual([]);
    expect(store.review()).toBeNull();
  });

  it('unwraps the paginated list', () => {
    store.getReviews().subscribe();

    const request = http.expectOne((req) => req.url === ENDPOINTS.reviews.list);
    expect(request.request.params.get('limit')).toBe('100');
    request.flush(page([review(), review({ id: 'r2' })]));

    expect(store.reviews().length).toBe(2);
  });

  it('toasts when the list fails', () => {
    store.getReviews().subscribe();

    http
      .expectOne((req) => req.url === ENDPOINTS.reviews.list)
      .flush({ message: 'Accès refusé' }, { status: 403, statusText: 'Forbidden' });

    expect(store.reviews()).toEqual([]);
    expect(toast.toasts()[0].message).toBe('Accès refusé');
  });

  it('stores the current review', () => {
    store.getReview('r1').subscribe();
    http.expectOne(ENDPOINTS.reviews.detail('r1')).flush(review());

    expect(store.review()?.id).toBe('r1');
  });

  it('creates a review for a product and appends it', () => {
    store.createReview('p1', { rating: 4, comment: 'Très bon' }).subscribe();

    const request = http.expectOne(ENDPOINTS.reviews.create('p1'));
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ rating: 4, comment: 'Très bon' });
    request.flush(review({ id: 'r2', rating: 4, comment: 'Très bon' }));

    expect(store.reviews().map((item) => item.id)).toEqual(['r2']);
    expect(toast.toasts()[0].message).toBe('Avis créé avec succès');
  });

  it('updates a review in the list and the current one', () => {
    store.getReviews().subscribe();
    http.expectOne((req) => req.url === ENDPOINTS.reviews.list).flush(page([review()]));
    store.getReview('r1').subscribe();
    http.expectOne(ENDPOINTS.reviews.detail('r1')).flush(review());

    store.updateReview('r1', { rating: 3 }).subscribe();

    const request = http.expectOne(ENDPOINTS.reviews.update('r1'));
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ rating: 3 });
    request.flush(review({ rating: 3 }));

    expect(store.reviews()[0].rating).toBe(3);
    expect(store.review()?.rating).toBe(3);
  });

  it('deletes a review and clears the current one', () => {
    store.getReviews().subscribe();
    http
      .expectOne((req) => req.url === ENDPOINTS.reviews.list)
      .flush(page([review(), review({ id: 'r2' })]));
    store.getReview('r1').subscribe();
    http.expectOne(ENDPOINTS.reviews.detail('r1')).flush(review());

    store.deleteReview('r1').subscribe();

    const request = http.expectOne(ENDPOINTS.reviews.delete('r1'));
    expect(request.request.method).toBe('DELETE');
    request.flush(null);

    expect(store.reviews().map((item) => item.id)).toEqual(['r2']);
    expect(store.review()).toBeNull();
    expect(toast.toasts()[0].message).toBe('Avis supprimé');
  });

  it('toasts and keeps the review on delete failure', () => {
    store.getReviews().subscribe();
    http.expectOne((req) => req.url === ENDPOINTS.reviews.list).flush(page([review()]));

    store.deleteReview('r1').subscribe();

    http
      .expectOne(ENDPOINTS.reviews.delete('r1'))
      .flush({ message: 'Avis non autorisé' }, { status: 403, statusText: 'Forbidden' });

    expect(store.reviews().length).toBe(1);
    expect(toast.toasts()[0].message).toBe('Avis non autorisé');
  });

  it('clears the current review', () => {
    store.getReview('r1').subscribe();
    http.expectOne(ENDPOINTS.reviews.detail('r1')).flush(review());

    store.clearCurrent();

    expect(store.review()).toBeNull();
  });
});

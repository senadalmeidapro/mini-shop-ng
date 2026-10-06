import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ENDPOINTS } from '../../../core/api/endpoints';
import { AuthService } from '../../../core/auth/auth.service';
import { Paginate, Product } from '../../../core/models';
import { ToastService } from '../../../core/toast/toast.service';
import { Home } from './home';

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    categoryId: 'c1',
    name: 'Clavier mécanique',
    description: 'Switches linéaires',
    price: 125000,
    stock: 3,
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

describe('Home', () => {
  let fixture: ComponentFixture<Home>;
  let component: Home;
  let http: HttpTestingController;
  let toast: ToastService;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    toast = TestBed.inject(ToastService);
    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
  });

  afterEach(() => localStorage.clear());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads the products on init', () => {
    fixture.detectChanges();

    const request = http.expectOne((req) => req.url === ENDPOINTS.products.list);
    request.flush(page([product(), product({ id: 'p2', name: 'Souris' })]));

    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.home__item').length).toBe(2);
  });

  it('shows the empty state when there is no product in stock', () => {
    fixture.detectChanges();
    http
      .expectOne((req) => req.url === ENDPOINTS.products.list)
      .flush(page([product({ stock: 0 })]));

    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.saas-empty__title')?.textContent).toContain(
      'Aucun produit disponible',
    );
  });

  it('warns instead of adding to the cart when the visitor is anonymous', () => {
    component['addToCart'](new MouseEvent('click'), product());

    expect(toast.toasts()[0].message).toBe('Connectez-vous pour ajouter au panier.');
    http.verify();
  });

  it('adds the product to the cart when authenticated', () => {
    TestBed.inject(AuthService).setTokens({
      accessToken: 'header.eyJyb2xlIjoidXNlciJ9.sig',
      refreshToken: 'refresh',
    });

    component['addToCart'](new MouseEvent('click'), product());

    const add = http.expectOne(ENDPOINTS.cart.addItem('p1'));
    expect(add.request.body).toEqual({ quantity: 1 });
    add.flush({ id: 'ci1' });

    http.expectOne(ENDPOINTS.cart.mine).flush(null);
    http.expectOne((req) => req.url === ENDPOINTS.products.list).flush(page([]));

    expect(toast.toasts().map((item) => item.message)).toContain('Produit ajouté au panier');
  });
});

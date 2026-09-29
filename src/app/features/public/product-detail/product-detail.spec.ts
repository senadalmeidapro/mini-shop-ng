import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { ENDPOINTS } from '../../../core/api/endpoints';
import { AuthService } from '../../../core/auth/auth.service';
import { Product } from '../../../core/models';
import { ToastService } from '../../../core/toast/toast.service';
import { ProductDetail } from './product-detail';

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

describe('ProductDetail', () => {
  let fixture: ComponentFixture<ProductDetail>;
  let component: ProductDetail;
  let http: HttpTestingController;
  let toast: ToastService;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [ProductDetail],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: 'p1' })) } },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    toast = TestBed.inject(ToastService);
    fixture = TestBed.createComponent(ProductDetail);
    component = fixture.componentInstance;
  });

  afterEach(() => localStorage.clear());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads the product of the route param', () => {
    fixture.detectChanges();

    const request = http.expectOne(ENDPOINTS.products.detail('p1'));
    expect(request.request.method).toBe('GET');
    request.flush(product());

    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Clavier mécanique');
  });

  it('clamps the quantity between 1 and the stock', () => {
    fixture.detectChanges();
    http.expectOne(ENDPOINTS.products.detail('p1')).flush(product());

    component['onQuantityChange'](99);
    expect(component['quantity']()).toBe(3);

    component['onQuantityChange'](0);
    expect(component['quantity']()).toBe(1);

    component['onQuantityChange'](2);
    expect(component['quantity']()).toBe(2);
  });

  it('warns instead of adding to the cart when the visitor is anonymous', () => {
    fixture.detectChanges();
    http.expectOne(ENDPOINTS.products.detail('p1')).flush(product());

    component['addProduct']();

    expect(toast.toasts()[0].message).toBe('Connectez-vous pour ajouter au panier.');
    http.verify();
  });

  it('adds the product to the cart then reloads it when authenticated', () => {
    TestBed.inject(AuthService).setTokens({
      accessToken: 'header.eyJyb2xlIjoidXNlciJ9.sig',
      refreshToken: 'refresh',
    });

    fixture.detectChanges();
    http.expectOne(ENDPOINTS.products.detail('p1')).flush(product());

    component['addProduct']();

    const add = http.expectOne(ENDPOINTS.cart.addItem('p1'));
    expect(add.request.body).toEqual({ quantity: 1 });
    add.flush({ id: 'ci1' });

    http.expectOne(ENDPOINTS.cart.mine).flush(null);
    http.expectOne(ENDPOINTS.products.detail('p1')).flush(product());

    expect(toast.toasts().map((item) => item.message)).toContain('Produit ajouté au panier');
  });
});

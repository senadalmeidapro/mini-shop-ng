import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { ENDPOINTS } from '../../../core/api/endpoints';
import { Product, ShopDetail, User } from '../../../core/models';
import { ShopDetail as ShopDetailPage } from './shop-detail';

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

function owner(): User {
  return { id: 'u1', email: 'seller@example.com', role: 'user' };
}

function shopDetail(overrides: Partial<ShopDetail> = {}): ShopDetail {
  return {
    id: 'sh1',
    ownerId: 'u1',
    name: 'Boutique Demo',
    slug: 'boutique-demo',
    description: 'Une boutique de démo',
    isActive: true,
    owner: owner(),
    products: [product(), product({ id: 'p2', name: 'Souris' })],
    ...overrides,
  };
}

describe('ShopDetail', () => {
  let fixture: ComponentFixture<ShopDetailPage>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShopDetailPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: 'sh1' })) } },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ShopDetailPage);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('loads the shop of the route param and lists its products', () => {
    fixture.detectChanges();

    const request = http.expectOne(ENDPOINTS.shops.detail('sh1'));
    expect(request.request.method).toBe('GET');
    request.flush(shopDetail());

    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Boutique Demo');
    expect(fixture.nativeElement.querySelectorAll('app-product-card').length).toBe(2);
  });

  it('shows the not found state when the shop is missing', () => {
    fixture.detectChanges();
    http
      .expectOne(ENDPOINTS.shops.detail('sh1'))
      .flush({ message: 'Introuvable' }, { status: 404, statusText: 'Not Found' });

    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-product-card')).toBeNull();
  });
});

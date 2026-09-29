import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { ENDPOINTS } from '../../../core/api/endpoints';
import { VerifyEmail } from './verify-email';

async function setup(token: string | null) {
  await TestBed.configureTestingModule({
    imports: [VerifyEmail],
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { queryParamMap: convertToParamMap(token ? { token } : {}) } },
      },
    ],
  }).compileComponents();

  const httpMock = TestBed.inject(HttpTestingController);
  const fixture: ComponentFixture<VerifyEmail> = TestBed.createComponent(VerifyEmail);
  fixture.detectChanges();

  return { fixture, component: fixture.componentInstance, httpMock };
}

describe('VerifyEmail', () => {
  it('should create', async () => {
    const { component } = await setup(null);

    expect(component).toBeTruthy();
  });

  it('ends in error without a token and calls nothing', async () => {
    const { component, httpMock } = await setup(null);

    expect(component.status()).toBe('error');
    httpMock.verify();
  });

  it('reports success when the API accepts the token', async () => {
    const { component, httpMock } = await setup('valid-token');

    expect(component.status()).toBe('loading');

    httpMock.expectOne(ENDPOINTS.auth.verifyEmail).flush(null);

    expect(component.status()).toBe('success');
    httpMock.verify();
  });

  it('reports error when the API rejects the token', async () => {
    const { component, httpMock } = await setup('expired-token');

    httpMock
      .expectOne(ENDPOINTS.auth.verifyEmail)
      .flush({ message: 'Lien invalide' }, { status: 400, statusText: 'Bad Request' });

    expect(component.status()).toBe('error');
    httpMock.verify();
  });
});

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ENDPOINTS } from '../../../core/api/endpoints';
import { ResetPasswordRequest } from './reset-password-request';

describe('ResetPasswordRequest', () => {
  let component: ResetPasswordRequest;
  let fixture: ComponentFixture<ResetPasswordRequest>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResetPasswordRequest],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ResetPasswordRequest);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not call the API with a malformed email', () => {
    component.email.setValue('nope');
    component.submit();

    expect(component.email.touched).toBe(true);
    expect(component.sent()).toBe(false);
    httpMock.verify();
  });

  it('shows the confirmation state once the API answers', () => {
    component.email.setValue('user@shop.com');
    component.submit();

    httpMock.expectOne(ENDPOINTS.auth.resetPasswordRequest).flush(null);

    expect(component.sent()).toBe(true);
  });

  it('surfaces the API error message', () => {
    component.email.setValue('user@shop.com');
    component.submit();

    httpMock
      .expectOne(ENDPOINTS.auth.resetPasswordRequest)
      .flush({ message: 'Email inconnu' }, { status: 400, statusText: 'Bad Request' });

    expect(component.sent()).toBe(false);
    expect(component.error()).toBe('Email inconnu');
  });
});

import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ResetPassword } from './reset-password';

describe('ResetPassword', () => {
  let component: ResetPassword;
  let fixture: ComponentFixture<ResetPassword>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResetPassword],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPassword);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('is invalid when the two passwords differ', () => {
    component.form.setValue({ password: 'password123', confirm: 'password1234' });

    expect(component.form.hasError('passwordMismatch')).toBe(true);
  });

  it('is valid with two matching long passwords', () => {
    component.form.setValue({ password: 'password123', confirm: 'password123' });

    expect(component.form.valid).toBe(true);
  });

  it('reports an invalid link when no token is present in the URL', () => {
    component.form.setValue({ password: 'password123', confirm: 'password123' });
    component.submit();

    expect(component.error()).toContain('invalide');
  });
});

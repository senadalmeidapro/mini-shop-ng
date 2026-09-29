import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
    service.clear();
  });

  afterEach(() => service.clear());

  it('starts empty', () => {
    expect(service.toasts()).toEqual([]);
  });

  it('stacks toasts with an incrementing id', () => {
    service.success('Produit créé');
    service.error('Impossible de supprimer');

    const toasts = service.toasts();
    expect(toasts.length).toBe(2);
    expect(toasts[0]).toEqual({ id: 1, kind: 'success', message: 'Produit créé', duration: 4000 });
    expect(toasts[1].kind).toBe('error');
  });

  it('uses a longer duration for errors', () => {
    service.error('Oups');
    expect(service.toasts()[0].duration).toBe(6000);
  });

  it('dismisses a single toast', () => {
    service.success('A');
    service.info('B');

    service.dismiss(1);

    expect(service.toasts().map((toast) => toast.id)).toEqual([2]);
  });

  it('clears every toast', () => {
    service.success('A');
    service.warning('B');
    service.clear();
    expect(service.toasts()).toEqual([]);
  });

  it('turns an HttpErrorResponse into a readable message', () => {
    service.apiError(
      new HttpErrorResponse({
        status: 422,
        statusText: 'Unprocessable Entity',
        error: { message: 'Stock insuffisant' },
      }),
      'fallback',
    );

    expect(service.toasts()[0].message).toBe('Stock insuffisant');
  });

  it('falls back when the error carries no message', () => {
    service.apiError(new Error('boom'), 'Impossible de charger les produits');
    expect(service.toasts()[0].message).toBe('Impossible de charger les produits');
  });

  it('auto-dismisses after the duration', () => {
    vi.useFakeTimers();
    try {
      service.success('Temporaire', 3000);
      expect(service.toasts().length).toBe(1);

      vi.advanceTimersByTime(3000);
      expect(service.toasts().length).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('never auto-dismisses when the duration is 0', () => {
    vi.useFakeTimers();
    try {
      service.info('Persistant', 0);
      vi.advanceTimersByTime(60_000);
      expect(service.toasts().length).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });
});

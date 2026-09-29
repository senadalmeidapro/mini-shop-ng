import { Injectable, signal } from '@angular/core';

import { toApiError } from '../api/errors';

export type ToastKind = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
  duration: number;
}

const DEFAULT_DURATION = 4000;
const ERROR_DURATION = 6000;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly state = signal<Toast[]>([]);
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();
  private nextId = 0;

  readonly toasts = this.state.asReadonly();

  success(message: string, duration = DEFAULT_DURATION): void {
    this.push('success', message, duration);
  }

  error(message: string, duration = ERROR_DURATION): void {
    this.push('error', message, duration);
  }

  info(message: string, duration = DEFAULT_DURATION): void {
    this.push('info', message, duration);
  }

  warning(message: string, duration = DEFAULT_DURATION): void {
    this.push('warning', message, duration);
  }

  apiError(error: unknown, fallback: string): void {
    this.error(toApiError(error, fallback).message);
  }

  dismiss(id: number): void {
    this.clearTimer(id);
    this.state.update((list) => list.filter((toast) => toast.id !== id));
  }

  clear(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.state.set([]);
  }

  private push(kind: ToastKind, message: string, duration: number): void {
    const id = ++this.nextId;
    this.state.update((list) => [...list, { id, kind, message, duration }]);

    if (duration > 0) {
      this.timers.set(
        id,
        setTimeout(() => this.dismiss(id), duration),
      );
    }
  }

  private clearTimer(id: number): void {
    const timer = this.timers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }
}

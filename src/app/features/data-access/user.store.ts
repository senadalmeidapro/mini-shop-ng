import { Injectable, inject, signal } from '@angular/core';
import { EMPTY, Observable, catchError, finalize, map, tap } from 'rxjs';

import { ENDPOINTS } from '../../core/api/endpoints';
import { Http } from '../../core/api/http';
import { Paginate, Role, User } from '../../core/models';
import { ToastService } from '../../core/toast/toast.service';

export interface CreateUserDto {
  email: string;
  password: string;
  fullName?: string;
}

export interface UpdateUserDto {
  email?: string;
  password?: string;
  fullName?: string;
}

export interface UserQuery {
  search?: string;
  page?: number;
  limit?: number;
  role?: Role | string;
  active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserStore {
  private readonly http = inject(Http);
  private readonly toast = inject(ToastService);

  private readonly current = signal<User | null>(null);
  private readonly list = signal<User[]>([]);
  private readonly loading = signal(false);

  readonly users = this.list.asReadonly();
  readonly user = this.current.asReadonly();
  readonly isLoading = this.loading.asReadonly();

  getUsers(params: UserQuery = { page: 1, limit: 100 }): Observable<User[]> {
    this.loading.set(true);

    return this.http
      .get<Paginate<User>>(ENDPOINTS.users.list, {
        params: params as Record<string, string | number | boolean>,
      })
      .pipe(
        map((response) => response.items),
        tap((items) => this.list.set(items)),
        catchError((error: unknown) => {
          this.toast.apiError(error, 'Impossible de charger les utilisateurs');
          return EMPTY;
        }),
        finalize(() => this.loading.set(false)),
      );
  }

  getUser(id: string): Observable<User> {
    return this.http.get<User>(ENDPOINTS.users.detail(id)).pipe(
      tap((user) => this.current.set(user)),
      catchError((error: unknown) => {
        this.toast.apiError(error, "Impossible de charger l'utilisateur");
        return EMPTY;
      }),
    );
  }

  createUser(data: CreateUserDto): Observable<User> {
    return this.http.post<User>(ENDPOINTS.users.create, data).pipe(
      tap((user) => {
        this.list.update((users) => [...users, user]);
        this.toast.success('Utilisateur créé');
      }),
      catchError((error: unknown) => {
        this.toast.apiError(error, "Impossible de créer l'utilisateur");
        return EMPTY;
      }),
    );
  }

  updateUser(id: string, data: UpdateUserDto): Observable<User> {
    return this.http.patch<User>(ENDPOINTS.users.update(id), data).pipe(
      tap((user) => {
        this.list.update((users) => users.map((item) => (item.id === id ? user : item)));

        if (this.current()?.id === id) {
          this.current.set(user);
        }
      }),
      catchError((error: unknown) => {
        this.toast.apiError(error, "Impossible de mettre à jour l'utilisateur");
        return EMPTY;
      }),
    );
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(ENDPOINTS.users.delete(id)).pipe(
      tap(() => {
        this.list.update((users) => users.filter((user) => user.id !== id));

        if (this.current()?.id === id) {
          this.current.set(null);
        }

        this.toast.success('Utilisateur supprimé');
      }),
      catchError((error: unknown) => {
        this.toast.apiError(error, "Impossible de supprimer l'utilisateur");
        return EMPTY;
      }),
    );
  }

  clearCurrent(): void {
    this.current.set(null);
  }
}

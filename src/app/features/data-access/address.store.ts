import { Injectable, inject, signal } from '@angular/core';
import { EMPTY, Observable, catchError, tap } from 'rxjs';

import { ENDPOINTS } from '../../core/api/endpoints';
import { Http } from '../../core/api/http';
import { Address } from '../../core/models';
import { ToastService } from '../../core/toast/toast.service';

export interface CreateAddressDto {
  street?: string;
  city: string;
  country: string;
  zip?: string;
}

@Injectable({ providedIn: 'root' })
export class AddressStore {
  private readonly http = inject(Http);
  private readonly toast = inject(ToastService);

  private readonly list = signal<Address[]>([]);

  readonly addresses = this.list.asReadonly();

  createAddress(data: CreateAddressDto): Observable<Address> {
    return this.http.post<Address>(ENDPOINTS.users.address, data).pipe(
      tap((address) => {
        this.list.update((addresses) => [...addresses, address]);
        this.toast.success('Adresse enregistrée avec succès');
      }),
      catchError((error: unknown) => {
        this.toast.apiError(error, "Impossible d'enregistrer l'adresse");
        return EMPTY;
      }),
    );
  }

  clear(): void {
    this.list.set([]);
  }
}

import { HttpClient, HttpContext, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface HttpConfig {
  headers?: HttpHeaders | Record<string, string | string[]>;
  context?: HttpContext;
  params?:
    HttpParams | Record<string, string | number | boolean | readonly (string | number | boolean)[]>;
  withCredentials?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class Http {
  private http = inject(HttpClient);

  get<T>(url: string, config?: HttpConfig): Observable<T> {
    return this.http.get<T>(url, config);
  }

  post<T>(url: string, data?: unknown, config?: HttpConfig): Observable<T> {
    return this.http.post<T>(url, data, config);
  }

  put<T>(url: string, data?: unknown, config?: HttpConfig): Observable<T> {
    return this.http.put<T>(url, data, config);
  }

  patch<T>(url: string, data?: unknown, config?: HttpConfig): Observable<T> {
    return this.http.patch<T>(url, data, config);
  }

  delete<T>(url: string, config?: HttpConfig): Observable<T> {
    return this.http.delete<T>(url, config);
  }
}

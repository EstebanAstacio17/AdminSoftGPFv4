import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LoginResponse } from '../models/auth.models';

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // Conexión a la API REST de ASP.NET Core desde los environments
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  // ── Auth ────────────────────────────────────────────────────────────
  login(credentials: { email: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/auth/login`, credentials);
  }

  impersonate(tenantId: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/auth/impersonate/${tenantId}`, {});
  }

  // ── Generic helpers ─────────────────────────────────────────────────
  get<T>(endpoint: string, fallback?: T): Observable<T> {
    const req = this.http.get<T>(`${this.baseUrl}/${endpoint}`);
    if (fallback !== undefined) {
      return req.pipe(
        catchError((err) => {
          console.warn(`[ApiService] GET /${endpoint} failed, using fallback:`, err);
          return of(fallback);
        })
      );
    }
    return req;
  }

  post<T>(endpoint: string, body: any, fallback?: T): Observable<T> {
    const req = this.http.post<T>(`${this.baseUrl}/${endpoint}`, body);
    if (fallback !== undefined) {
      return req.pipe(
        catchError((err) => {
          console.warn(`[ApiService] POST /${endpoint} failed, using fallback:`, err);
          return of(fallback);
        })
      );
    }
    return req;
  }

  put<T>(endpoint: string, body: any, fallback?: T): Observable<T> {
    const req = this.http.put<T>(`${this.baseUrl}/${endpoint}`, body);
    if (fallback !== undefined) {
      return req.pipe(
        catchError((err) => {
          console.warn(`[ApiService] PUT /${endpoint} failed, using fallback:`, err);
          return of(fallback);
        })
      );
    }
    return req;
  }

  patch<T>(endpoint: string, body: any, fallback?: T): Observable<T> {
    const req = this.http.patch<T>(`${this.baseUrl}/${endpoint}`, body);
    if (fallback !== undefined) {
      return req.pipe(
        catchError((err) => {
          console.warn(`[ApiService] PATCH /${endpoint} failed, using fallback:`, err);
          return of(fallback);
        })
      );
    }
    return req;
  }

  delete<T>(endpoint: string, fallback?: T): Observable<T> {
    const req = this.http.delete<T>(`${this.baseUrl}/${endpoint}`);
    if (fallback !== undefined) {
      return req.pipe(
        catchError((err) => {
          console.warn(`[ApiService] DELETE /${endpoint} failed, using fallback:`, err);
          return of(fallback);
        })
      );
    }
    return req;
  }
}

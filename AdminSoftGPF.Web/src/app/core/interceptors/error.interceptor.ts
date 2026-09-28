import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();
        router.navigate(['/auth/login']);
      } else if (error.status === 403) {
        // Redirigir o notificar sobre acceso denegado / cuenta en mora / suspendido
        console.warn('Acceso denegado o cuenta bloqueada/en mora (403).');
      } else if (error.status === 400) {
        console.error('Error de validación o DomainException (400).', error.error);
      }
      return throwError(() => error);
    })
  );
};

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  let authReq = req;

  // Attach token if present and not already attached
  if (token && !req.headers.has('Authorization')) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // If 401 Unauthorized is returned by backend (and not the login endpoint itself)
      if (error.status === 401 && !req.url.includes('/api/auth/login')) {
        console.warn('[jwtInterceptor] Backend returned 401 Unauthorized! Logging out expired session.');
        authService.logoutAndRedirect('Your session has expired. Please log in again.');
      }
      return throwError(() => error);
    })
  );
};

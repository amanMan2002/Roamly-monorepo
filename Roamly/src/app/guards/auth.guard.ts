import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const loggedIn = authService.isLoggedIn();
  console.log('[authGuard] Checking /home access. Authenticated:', loggedIn);

  if (loggedIn) {
    return true;
  }

  console.warn('[authGuard] Access denied to /home. Redirecting to /login');
  router.navigate(['/login']);
  return false;
};

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const loggedIn = authService.isLoggedIn();
  console.log('[guestGuard] Checking guest access. Authenticated:', loggedIn);

  if (loggedIn) {
    console.log('[guestGuard] Already authenticated, redirecting to /home');
    router.navigate(['/home']);
    return false;
  }

  return true;
};

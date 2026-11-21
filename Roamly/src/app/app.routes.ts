import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/home/home').then((m) => m.HomeComponent),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/profile/profile').then((m) => m.ProfileComponent),
  },
  {
    path: 'profile/:username',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/profile/profile').then((m) => m.ProfileComponent),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'signup',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/signup/signup').then((m) => m.SignupComponent),
  },
  { path: '**', redirectTo: '/home' }
];

import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token?: string;
  jwtToken?: string;
  jwt?: string;
  accessToken?: string;
  username?: string;
  [key: string]: unknown;
}

export interface SignUpResponse {
  token?: string;
  jwtToken?: string;
  jwt?: string;
  accessToken?: string;
  message?: string;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly BASE_URL = 'http://localhost:8081/api/auth';

  private autoLogoutTimer: any = null;

  readonly currentUser = signal<string | null>(this.getInitialUser());
  readonly isAuthenticated = signal<boolean>(this.getInitialAuthState());
  readonly sessionExpiredMessage = signal<string | null>(null);

  constructor() {
    if (this.isBrowser) {
      const token = this.getToken();
      if (token) {
        if (this.isTokenExpired(token)) {
          console.warn('[AuthService] Existing token is already expired.');
          this.logout();
        } else {
          this.scheduleAutoLogout(token);
        }
      }
    }
  }

  private getInitialUser(): string | null {
    if (this.isBrowser) {
      return localStorage.getItem('roamly_username');
    }
    return null;
  }

  private getInitialAuthState(): boolean {
    if (this.isBrowser) {
      const token = localStorage.getItem('jwt_token');
      return !!token && !this.isTokenExpired(token);
    }
    return false;
  }

  getJwtPayload(token: string): { exp?: number; sub?: string; [key: string]: any } | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  isTokenExpired(token?: string | null): boolean {
    const jwt = token ?? this.getToken();
    if (!jwt) return true;

    const payload = this.getJwtPayload(jwt);
    if (!payload || !payload.exp) {
      return false; // Fallback if dummy or non-standard token
    }

    // payload.exp is in seconds, Date.now() is in milliseconds
    return Date.now() >= payload.exp * 1000;
  }

  scheduleAutoLogout(token: string): void {
    if (!this.isBrowser) return;

    if (this.autoLogoutTimer) {
      clearTimeout(this.autoLogoutTimer);
      this.autoLogoutTimer = null;
    }

    const payload = this.getJwtPayload(token);
    if (!payload || !payload.exp) {
      return;
    }

    const expiresInMs = payload.exp * 1000 - Date.now();
    console.log(`[AuthService] Session scheduled to expire in ${(expiresInMs / 1000).toFixed(0)} seconds.`);

    if (expiresInMs <= 0) {
      this.logoutAndRedirect('Your session has expired. Please sign in again.');
      return;
    }

    this.autoLogoutTimer = setTimeout(() => {
      console.warn('[AuthService] 10-minute JWT token has expired! Redirecting to /login...');
      this.logoutAndRedirect('Your session has expired. Please log in again to continue.');
    }, expiresInMs);
  }

  logoutAndRedirect(message?: string): void {
    this.logout();
    if (message) {
      this.sessionExpiredMessage.set(message);
    }
    this.router.navigate(['/login'], { queryParams: { expired: 'true' } });
  }

  extractToken(res: any): string | null {
    if (!res) return null;
    if (typeof res === 'string') return res;
    return (
      res.token ||
      res.jwt ||
      res.jwtToken ||
      res.jwt_token ||
      res.accessToken ||
      res.access_token ||
      res.idToken ||
      res.data?.token ||
      res.data?.jwt ||
      res.data?.jwtToken ||
      res.data?.accessToken ||
      null
    );
  }

  login(credentials: LoginRequest): Observable<any> {
    return this.http.post<any>(`${this.BASE_URL}/login`, credentials).pipe(
      tap((res) => {
        console.log('[AuthService] Login API response:', res);
        const token = this.extractToken(res);
        if (token) {
          this.saveSession(token, credentials.username);
        } else {
          console.warn('[AuthService] No recognized token field in response. Available keys:', Object.keys(res || {}));
          this.saveSession('session_active', credentials.username);
        }
      })
    );
  }

  signup(credentials: LoginRequest): Observable<any> {
    return this.http.post<any>(`${this.BASE_URL}/signup`, credentials).pipe(
      tap((res) => {
        console.log('[AuthService] Signup API response:', res);
        const token = this.extractToken(res);
        if (token) {
          this.saveSession(token, credentials.username);
        }
      })
    );
  }

  saveSession(token: string, username: string): void {
    if (this.isBrowser) {
      localStorage.setItem('jwt_token', token);
      localStorage.setItem('roamly_username', username);
    }
    this.currentUser.set(username);
    this.isAuthenticated.set(true);
    this.sessionExpiredMessage.set(null); // Clear any previous expired banner
    this.scheduleAutoLogout(token);
    console.log('[AuthService] Session saved. User:', username);
  }

  saveToken(token: string): void {
    if (this.isBrowser) {
      localStorage.setItem('jwt_token', token);
    }
    this.isAuthenticated.set(true);
    this.scheduleAutoLogout(token);
  }

  getToken(): string | null {
    if (this.isBrowser) {
      return localStorage.getItem('jwt_token');
    }
    return null;
  }

  getUsername(): string | null {
    return this.currentUser();
  }

  logout(): void {
    if (this.autoLogoutTimer) {
      clearTimeout(this.autoLogoutTimer);
      this.autoLogoutTimer = null;
    }
    if (this.isBrowser) {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('roamly_username');
    }
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated() && !this.isTokenExpired();
  }
}

import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  username = signal('');
  password = signal('');
  loading = signal(false);
  error = signal('');
  readonly sessionExpiredMessage = this.authService.sessionExpiredMessage;

  onUsernameChange(val: string) { this.username.set(val); }
  onPasswordChange(val: string) { this.password.set(val); }

  onSubmit() {
    this.error.set('');
    this.loading.set(true);
    console.log('[LoginComponent] Submitting credentials for:', this.username());

    this.authService.login({ username: this.username(), password: this.password() }).subscribe({
      next: (res) => {
        console.log('[LoginComponent] Login response received:', res);
        this.loading.set(false);

        const token = this.authService.extractToken(res);
        if (token) {
          this.authService.saveSession(token, this.username());
        }

        console.log('[LoginComponent] Navigating to /home. Current isLoggedIn:', this.authService.isLoggedIn());
        this.router.navigate(['/home']).then((navigated) => {
          console.log('[LoginComponent] router.navigate result:', navigated);
          if (!navigated) {
            console.error('[LoginComponent] Navigation was cancelled or redirected by Route Guard.');
          }
        }).catch((err) => {
          console.error('[LoginComponent] Navigation error:', err);
        });
      },
      error: (err) => {
        console.error('[LoginComponent] Login HTTP Error:', err);
        this.loading.set(false);

        if (err.status === 0) {
          this.error.set(
            'CORS or Connection Error: Cannot connect to http://localhost:8081. Ensure your backend is running and @CrossOrigin(origins = "http://localhost:4200") is added to your AuthController.'
          );
        } else if (err.status === 401 || err.status === 403) {
          this.error.set('Invalid username or password. Please try again.');
        } else {
          this.error.set(err?.error?.message || err?.message || 'Login failed. Please check backend connection.');
        }
      }
    });
  }
}

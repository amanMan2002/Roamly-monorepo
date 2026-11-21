import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './signup.html',
  styleUrl: './signup.css'
})
export class SignupComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  username = signal('');
  password = signal('');
  confirmPassword = signal('');
  loading = signal(false);
  error = signal('');
  success = signal('');

  onUsernameChange(val: string) { this.username.set(val); }
  onPasswordChange(val: string) { this.password.set(val); }
  onConfirmPasswordChange(val: string) { this.confirmPassword.set(val); }

  onSubmit() {
    this.error.set('');
    this.success.set('');

    if (this.password() !== this.confirmPassword()) {
      this.error.set('Passwords do not match.');
      return;
    }

    this.loading.set(true);
    this.authService.signup({ username: this.username(), password: this.password() }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res?.token) {
          this.authService.saveSession(res.token as string, this.username());
          this.success.set('Account created! Welcome to Roamly...');
          setTimeout(() => this.router.navigate(['/home']), 800);
        } else {
          // Auto-login to obtain JWT token and navigate to /home
          this.authService.login({ username: this.username(), password: this.password() }).subscribe({
            next: () => {
              this.success.set('Account created! Welcome to Roamly...');
              setTimeout(() => this.router.navigate(['/home']), 800);
            },
            error: () => {
              this.success.set('Account created! Redirecting to login...');
              setTimeout(() => this.router.navigate(['/login']), 1200);
            }
          });
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Sign up failed. Please try again.');
      }
    });
  }
}


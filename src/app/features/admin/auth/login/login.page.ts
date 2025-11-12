import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AdminAuthService } from '../../../../core/services/admin-auth.service';

/**
 * Admin Login Page
 * 
 * Provides email/password authentication for admin users.
 * Features:
 * - Reactive form with validation
 * - Account lockout handling (5 attempts → 15min lock)
 * - Return URL redirect after successful login
 * - Loading states and error messages
 * - Accessibility: ARIA labels, keyboard navigation
 */
@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, RouterModule]
})
export class LoginPage implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AdminAuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm!: FormGroup;
  loading = false;
  errorMessage = '';
  returnUrl = '/admin/dashboard';

  ngOnInit() {
    // Initialize form
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });

    // Get return URL from query params
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/admin/dashboard';

    // Check if already authenticated
    this.authService.isAuthenticated().subscribe(isAuth => {
      if (isAuth) {
        this.router.navigate([this.returnUrl]);
      }
    });
  }

  /**
   * Handle form submission
   */
  async onSubmit() {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const credentials = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.loading = false;

        if (response.success) {
          // Successful login - navigate to return URL
          this.router.navigate([this.returnUrl]);
        } else {
          // Login failed - show error
          this.errorMessage = response.error || 'Login failed. Please try again.';
          
          // Clear password field on error
          this.loginForm.patchValue({ password: '' });
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error || 'An unexpected error occurred. Please try again.';
        this.loginForm.patchValue({ password: '' });
      }
    });
  }

  /**
   * Navigate to forgot password page
   */
  goToForgotPassword() {
    this.router.navigate(['/admin/forgot-password']);
  }

  /**
   * Get form control by name
   */
  getControl(controlName: string) {
    return this.loginForm.get(controlName);
  }

  /**
   * Check if field has error and is touched
   */
  hasError(controlName: string, errorType: string): boolean {
    const control = this.getControl(controlName);
    return !!(control && control.hasError(errorType) && control.touched);
  }

  /**
   * Mark all form fields as touched to trigger validation messages
   */
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}

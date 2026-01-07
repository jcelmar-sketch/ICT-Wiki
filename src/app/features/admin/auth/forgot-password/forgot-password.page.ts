import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../../../environments/environment';

/**
 * Forgot Password Page
 * 
 * Allows admin users to request a password reset email.
 * Uses Supabase Auth resetPasswordForEmail API.
 */
@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule]
})
export class ForgotPasswordPage implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  forgotPasswordForm!: FormGroup;
  loading = false;
  submitted = false;
  errorMessage = '';
  successMessage = '';
  private supabase!: SupabaseClient;

  ngOnInit() {
    this.initializeSupabase();
    
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  private async initializeSupabase(): Promise<void> {
    const { createClient } = await import('@supabase/supabase-js');
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey
    );
  }

  /**
   * Handle form submission
   */
  async onSubmit() {
    if (this.forgotPasswordForm.invalid) {
      this.markFormGroupTouched(this.forgotPasswordForm);
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const email = this.forgotPasswordForm.value.email;

    try {
      await this.initializeSupabase();

      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/reset-password`
      });

      this.loading = false;

      if (error) {
        this.errorMessage = 'Failed to send reset email. Please try again.';
        console.error('Password reset error:', error);
      } else {
        this.submitted = true;
        this.successMessage = `Password reset instructions have been sent to ${email}. Please check your inbox.`;
        
        // Clear form
        this.forgotPasswordForm.reset();
      }
    } catch (error) {
      this.loading = false;
      this.errorMessage = 'An unexpected error occurred. Please try again.';
      console.error('Password reset exception:', error);
    }
  }

  /**
   * Navigate back to login
   */
  goToLogin() {
    this.router.navigate(['/admin/login']);
  }

  /**
   * Get form control by name
   */
  getControl(controlName: string) {
    return this.forgotPasswordForm.get(controlName);
  }

  /**
   * Check if field has error and is touched
   */
  hasError(controlName: string, errorType: string): boolean {
    const control = this.getControl(controlName);
    return !!(control && control.hasError(errorType) && control.touched);
  }

  /**
   * Mark all form fields as touched
   */
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}

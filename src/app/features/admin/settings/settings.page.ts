import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, ToastController, AlertController, LoadingController } from '@ionic/angular';
import { AdminAuthService } from '../../../core/services/admin-auth.service';
import { AdminUser } from '../../../core/models/admin.model';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * Admin Settings Page
 * 
 * Allows admin users to:
 * - Change password (with current password verification)
 * - Change email address (with password verification)
 * - View account information
 * - View last login time
 * 
 * Security Features:
 * - Password confirmation field
 * - Email uniqueness validation
 * - Current password verification for both operations
 * - Activity logging of all changes
 * - Toast notifications for feedback
 */
@Component({
  selector: 'app-admin-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule]
})
export class AdminSettingsPage implements OnInit, OnDestroy {
  private formBuilder = inject(FormBuilder);
  private authService = inject(AdminAuthService);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);
  private loadingController = inject(LoadingController);
  private destroy$ = new Subject<void>();

  currentUser$!: Observable<AdminUser | null>;
  currentUser: AdminUser | null = null;

  // Form groups
  passwordForm!: FormGroup;
  emailForm!: FormGroup;

  // UI state
  showPasswordForm = false;
  showEmailForm = false;
  passwordSubmitting = false;
  emailSubmitting = false;
  passwordFieldType = 'password';
  currentPasswordFieldType = 'password';
  emailPasswordFieldType = 'password';

  ngOnInit(): void {
    this.currentUser$ = this.authService.getCurrentUser();
    
    this.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
      });

    this.initializeForms();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize both form groups with validators
   */
  private initializeForms(): void {
    // Password change form
    this.passwordForm = this.formBuilder.group({
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, {
      validators: this.passwordMatchValidator
    });

    // Email change form
    this.emailForm = this.formBuilder.group({
      newEmail: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  /**
   * Custom validator to check if passwords match
   */
  private passwordMatchValidator(form: FormGroup): { [key: string]: any } | null {
    const password = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  /**
   * Toggle password change form visibility
   */
  togglePasswordForm(): void {
    this.showPasswordForm = !this.showPasswordForm;
    if (!this.showPasswordForm) {
      this.passwordForm.reset();
    }
  }

  /**
   * Toggle email change form visibility
   */
  toggleEmailForm(): void {
    this.showEmailForm = !this.showEmailForm;
    if (!this.showEmailForm) {
      this.emailForm.reset();
    }
  }

  /**
   * Toggle password field visibility
   */
  togglePasswordVisibility(): void {
    this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
  }

  /**
   * Toggle current password field visibility
   */
  toggleCurrentPasswordVisibility(): void {
    this.currentPasswordFieldType = this.currentPasswordFieldType === 'password' ? 'text' : 'password';
  }

  /**
   * Toggle email password field visibility
   */
  toggleEmailPasswordVisibility(): void {
    this.emailPasswordFieldType = this.emailPasswordFieldType === 'password' ? 'text' : 'password';
  }

  /**
   * Handle password change submission
   */
  async submitPasswordChange(): Promise<void> {
    if (this.passwordForm.invalid) {
      await this.showToast('Please fix the errors in the form', 'warning');
      return;
    }

    this.passwordSubmitting = true;

    const { currentPassword, newPassword } = this.passwordForm.value;

    const loading = await this.loadingController.create({
      message: 'Updating password...'
    });
    await loading.present();

    this.authService.updatePassword(currentPassword, newPassword)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async (result) => {
          await loading.dismiss();
          this.passwordSubmitting = false;

          if (result.success) {
            await this.showToast(result.message, 'success');
            this.passwordForm.reset();
            this.showPasswordForm = false;
          } else {
            await this.showToast(result.message, 'danger');
          }
        },
        error: async (error) => {
          await loading.dismiss();
          this.passwordSubmitting = false;
          await this.showToast('An unexpected error occurred', 'danger');
        }
      });
  }

  /**
   * Handle email change submission with confirmation dialog
   */
  async submitEmailChange(): Promise<void> {
    if (this.emailForm.invalid) {
      await this.showToast('Please fix the errors in the form', 'warning');
      return;
    }

    const { newEmail } = this.emailForm.value;

    // Show confirmation dialog
    const alert = await this.alertController.create({
      header: 'Confirm Email Change',
      message: `Are you sure you want to change your email to ${newEmail}? You'll need to log in again with the new email.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Change Email',
          handler: () => {
            this.performEmailChange();
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Perform the actual email change
   */
  private performEmailChange(): void {
    this.emailSubmitting = true;

    const { newEmail, password } = this.emailForm.value;

    this.loadingController.create({
      message: 'Updating email...'
    }).then(async loading => {
      await loading.present();

      this.authService.updateEmail(newEmail, password)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: async (result) => {
            await loading.dismiss();
            this.emailSubmitting = false;

            if (result.success) {
              await this.showToast(result.message, 'success');
              this.emailForm.reset();
              this.showEmailForm = false;
              
              // Show alert that user needs to log in again
              const alert = await this.alertController.create({
                header: 'Email Updated',
                message: 'Your email has been changed. You will be logged out and need to log in again with your new email.',
                buttons: [
                  {
                    text: 'OK',
                    handler: () => {
                      this.authService.logout().subscribe();
                    }
                  }
                ]
              });
              await alert.present();
            } else {
              await this.showToast(result.message, 'danger');
            }
          },
          error: async (error) => {
            await loading.dismiss();
            this.emailSubmitting = false;
            await this.showToast('An unexpected error occurred', 'danger');
          }
        });
    });
  }

  /**
   * Format date for display
   */
  formatDate(date: string | null): string {
    if (!date) return 'Never';
    
    try {
      return new Date(date).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  }

  /**
   * Show toast notification
   */
  private async showToast(message: string, color: 'success' | 'warning' | 'danger'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color
    });
    await toast.present();
  }

  /**
   * Get form control error message
   */
  getErrorMessage(form: FormGroup, fieldName: string): string {
    const control = form.get(fieldName);
    
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    if (control.errors['required']) {
      return `${this.formatFieldName(fieldName)} is required`;
    }
    if (control.errors['minlength']) {
      const minLength = control.errors['minlength'].requiredLength;
      return `${this.formatFieldName(fieldName)} must be at least ${minLength} characters`;
    }
    if (control.errors['email']) {
      return 'Please enter a valid email address';
    }

    return 'Invalid input';
  }

  /**
   * Get form-level error message
   */
  getFormErrorMessage(form: FormGroup, errorType: string): string {
    if (errorType === 'passwordMismatch') {
      return 'Passwords do not match';
    }
    return '';
  }

  /**
   * Check if password mismatch error exists
   */
  hasPasswordMismatch(): boolean {
    return !!(this.passwordForm.errors && this.passwordForm.errors['passwordMismatch'] && 
              (this.passwordForm.get('confirmPassword')?.touched || this.passwordForm.get('newPassword')?.touched));
  }

  /**
   * Format field name for display
   */
  private formatFieldName(name: string): string {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }
}

import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    RouterLink
  ]
})
export class ForgotPasswordComponent {
  resetForm: FormGroup;
  isLoading = false;
  error = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.resetForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (this.resetForm.valid) {
      this.isLoading = true;
      this.error = '';
      const email = this.resetForm.get('email')?.value;

      this.authService.requestPasswordReset(email).subscribe({
        next: () => {
          this.snackBar.open(
            'Ein neues Passwort wurde generiert und an Ihre E-Mail-Adresse gesendet.',
            'OK',
            { duration: 5000 }
          );
          this.router.navigate(['/login']);
        },
        error: (error) => {
          if (error.status === 404) {
            this.error = 'Diese E-Mail-Adresse wurde nicht gefunden.';
          } else {
            this.error = 'Fehler beim Zurücksetzen des Passworts. Bitte versuchen Sie es später erneut.';
          }
          console.error('Password reset error:', error);
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    }
  }
}

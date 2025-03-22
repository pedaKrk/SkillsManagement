import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ]
})
export class ChangePasswordComponent implements OnInit {
  passwordForm: FormGroup;
  isLoading = false;
  error = '';
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.passwordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      currentPassword: ['', Validators.required],
      newPassword: ['', Validators.required],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });

    // E-Mail-Adresse aus dem temporären oder eingeloggten Benutzer setzen
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      // Verwende die E-Mail-Adresse aus dem User-Objekt
      const emailToUse = currentUser.email || '';
      console.log('Setting email in form:', emailToUse);
      
      this.passwordForm.patchValue({
        email: emailToUse
      });

      // E-Mail-Feld deaktivieren, da wir die E-Mail vom Server haben
      if (emailToUse) {
        this.passwordForm.get('email')?.disable();
      }
    }
  }

  ngOnInit(): void {}

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null
      : { passwordMismatch: true };
  }

  onSubmit() {
    if (this.passwordForm.valid) {
      this.isLoading = true;
      this.error = '';

      const formValue = this.passwordForm.getRawValue();
      const { email, currentPassword, newPassword, confirmPassword } = formValue;

      this.authService.changePassword(currentPassword, newPassword, email, confirmPassword).subscribe({
        next: () => {
          
          this.authService.logout();
          this.router.navigate(['/login']);
        },
        error: (error) => {
          if (error.status === 401) {
            this.error = 'Das aktuelle Passwort ist nicht korrekt.';
          } else if (error.status === 400) {
            this.error = 'Das neue Passwort entspricht nicht den Anforderungen.';
          } else {
            this.error = 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.';
          }
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    }
  }
} 
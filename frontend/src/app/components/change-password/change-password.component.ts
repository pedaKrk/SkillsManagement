import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule
  ],
  template: `
    <div class="change-password-container">
      <h2>Passwort ändern</h2>
      <form [formGroup]="passwordForm" (ngSubmit)="onSubmit()">
        <mat-form-field appearance="fill">
          <mat-label>E-Mail</mat-label>
          <input matInput type="email" formControlName="email">
          <mat-error *ngIf="passwordForm.get('email')?.hasError('required')">
            Bitte geben Sie Ihre E-Mail-Adresse ein
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>Aktuelles Passwort</mat-label>
          <input matInput type="password" formControlName="currentPassword">
          <mat-error *ngIf="passwordForm.get('currentPassword')?.hasError('required')">
            Bitte geben Sie Ihr aktuelles Passwort ein
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>Neues Passwort</mat-label>
          <input matInput type="password" formControlName="newPassword">
          <mat-error *ngIf="passwordForm.get('newPassword')?.hasError('required')">
            Bitte geben Sie ein neues Passwort ein
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>Neues Passwort bestätigen</mat-label>
          <input matInput type="password" formControlName="confirmPassword">
          <mat-error *ngIf="passwordForm.get('confirmPassword')?.hasError('required')">
            Bitte bestätigen Sie Ihr neues Passwort
          </mat-error>
          <mat-error *ngIf="passwordForm.hasError('passwordMismatch')">
            Die Passwörter stimmen nicht überein
          </mat-error>
        </mat-form-field>

        <button mat-raised-button color="primary" type="submit" [disabled]="passwordForm.invalid">
          Passwort ändern
        </button>
      </form>
    </div>
  `,
  styles: [`
    .change-password-container {
      max-width: 400px;
      margin: 2rem auto;
      padding: 2rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    mat-form-field {
      width: 100%;
    }

    button {
      margin-top: 1rem;
    }
  `]
})
export class ChangePasswordComponent implements OnInit {
  passwordForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar,
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
      const formValues = this.passwordForm.getRawValue();
      const { email, currentPassword, newPassword, confirmPassword } = formValues;

      this.authService.changePassword(currentPassword, newPassword, email, confirmPassword)
        .subscribe({
          next: () => {
            this.snackBar.open('Passwort wurde erfolgreich geändert. Bitte melden Sie sich erneut an.', 'Schließen', {
              duration: 3000
            });
            
            // logout and redirect to login page
            this.authService.logout();
            this.router.navigate(['/login']);
          },
          error: (error: any) => {
            let errorMessage = 'Fehler beim Ändern des Passworts';
            if (error.error?.error) {
              errorMessage = error.error.error;
            } else if (error.error?.message) {
              errorMessage = error.error.message;
            }
            this.snackBar.open(errorMessage, 'Schließen', { duration: 3000 });
          }
        });
    }
  }
} 
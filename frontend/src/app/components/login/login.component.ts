import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  // Form properties
  loginForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  showPassword = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    // Initialize login form with required fields
    this.loginForm = this.formBuilder.group({
      identifier: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit() {
  }

  onSubmit() {
    this.submitted = true;

    // Return if form is invalid
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';

    // Get form values
    const identifier = this.loginForm.get('identifier')?.value;
    const password = this.loginForm.get('password')?.value;

    console.log('Attempting login with identifier:', identifier);

    // Attempt login with auth service
    this.authService.login(identifier, password).subscribe({
      next: (user) => {
        console.log('Login response:', user);
        
        if (!user.token) {
          this.error = 'Fehler beim Login: Kein Token erhalten';
          this.loading = false;
          return;
        }

        if (user.mustChangePassword) {
          console.log('User must change password, redirecting...');
          this.router.navigate(['/change-password']);
        } else {
          console.log('Login successful, redirecting to home page...');
          this.router.navigate(['/main']);
        }
      },
      error: error => {
        console.log('Login error details:', {
          status: error.status,
          message: error.error?.message,
          fullError: error
        });

        if (error.status === 403) {
          console.log('Handling 403 error...');
          if (error.error?.message === "User needs to change default password") {
            console.log('Password change required, redirecting...');
            this.router.navigate(['/change-password']);
            return;
          }
        }

        if (error.status === 401) {
          this.error = 'Ungültige Anmeldedaten';
        } else if (error.status === 0) {
          this.error = 'Verbindung zum Server fehlgeschlagen. Bitte überprüfen Sie Ihre Internetverbindung.';
        } else {
          this.error = `Fehler beim Login: ${error.error?.message || 'Unbekannter Fehler'}`;
        }
        this.loading = false;
      }
    });
  }
} 
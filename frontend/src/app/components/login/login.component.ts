import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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

    // Attempt login with auth service
    this.authService.login(identifier, password).subscribe({
      next: () => {
        // Navigate to user page on success
        this.router.navigate(['/user']);
      },
      error: error => {
        console.error('Login error:', error);
        // Handle different error cases
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
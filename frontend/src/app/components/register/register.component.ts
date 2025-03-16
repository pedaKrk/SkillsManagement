// Import required Angular modules and services
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  // Form properties
  registerForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    // Initialize registration form with required fields
    this.registerForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      title: [''], // Optional title field
      phoneNumber: [''], // Optional phone number field
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      employmentType: ['Internal', Validators.required]
    });
  }

  ngOnInit() {
  }

  // Handle form submission
  onSubmit() {
    this.submitted = true;

    // Return if form is invalid
    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';

    // Get form values
    const userData = {
      username: this.registerForm.get('username')?.value,
      email: this.registerForm.get('email')?.value,
      title: this.registerForm.get('title')?.value,
      phoneNumber: this.registerForm.get('phoneNumber')?.value,
      firstName: this.registerForm.get('firstName')?.value,
      lastName: this.registerForm.get('lastName')?.value,
      employmentType: this.registerForm.get('employmentType')?.value
    };

    // Call register method from auth service
    this.authService.register(userData).subscribe({
      next: () => {
        // Navigate to login page on success
        this.router.navigate(['/login']);
      },
      error: error => {
        console.error('Registration error:', error);
        // Handle different error cases
        if (error.status === 400) {
          this.error = error.error?.message || 'Ungültige Eingabedaten';
        } else if (error.status === 409) {
          this.error = 'Benutzername oder E-Mail bereits vergeben';
        } else if (error.status === 0) {
          this.error = 'Verbindung zum Server fehlgeschlagen. Bitte überprüfen Sie Ihre Internetverbindung.';
        } else if (error.status === 500) {
          this.error = 'Serverfehler bei der Registrierung. Bitte versuchen Sie es später erneut.';
        } else {
          this.error = `Fehler bei der Registrierung: ${error.error?.message || 'Unbekannter Fehler'}`;
        }
        this.loading = false;
      }
    });
  }
} 
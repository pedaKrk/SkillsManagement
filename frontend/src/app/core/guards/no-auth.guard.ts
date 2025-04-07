import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NoAuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate() {
    return this.authService.currentUser.pipe(
      map(user => {
        if (user) {
          // if user is logged in, redirect to main page
          this.router.navigate(['/main']);
          return false;
        }
        
        // if user is not logged in, allow access to login page
        return true;
      })
    );
  }
} 
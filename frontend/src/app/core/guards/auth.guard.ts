import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot) {
    return this.authService.currentUser.pipe(
      map(user => {
        if (route.routeConfig?.path === 'change-password' && this.authService.needsPasswordChange) {
          return true;
        }

        if (user) {
          return true;
        }
        
        this.router.navigate(['/login']);
        return false;
      })
    );
  }
} 
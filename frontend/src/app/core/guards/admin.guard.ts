import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { map } from 'rxjs/operators';
import { UserRole } from '../../models/enums/user-roles.enum';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot) {
    return this.authService.currentUser.pipe(
      map(user => {
        if (!user) {
          this.router.navigate(['/login']);
          return false;
        }

        const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.COMPETENCE_LEADER;
        
        if (!isAdmin) {
          this.router.navigate(['/main']);
          return false;
        }

        return true;
      })
    );
  }
} 
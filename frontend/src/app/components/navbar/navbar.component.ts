import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';
import { UserService } from '../../core/services/user/user.service';
import { UserRole } from '../../models/enums/user-roles.enum';
import { interval, Subscription } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
import { NotificationService } from '../../core/services/notification/notification.service';
import { ClickOutsideDirective } from '../../shared/directives/click-outside.directive';
import { LanguageSelectorComponent } from '../../shared/components/language-selector/language-selector.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, ClickOutsideDirective, LanguageSelectorComponent, TranslateModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  username: string | null = null;
  userId: string | null = null;
  isAdminOrCompetenceLeader = false;
  isLecturer = false;
  isDropdownOpen = false;
  isUserDropdownOpen = false;
  inactiveUsersCount = 0;
  isMenuOpen = false;
  private subscription: Subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private notificationService: NotificationService,
    private translateService: TranslateService
  ) {
    this.subscription.add(
      this.notificationService.inactiveUsersCountChanged$.subscribe(() => {
        this.loadInactiveUsersCount();
      })
    );
  }

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.isLoggedIn = !!user;
      this.username = user?.username || null;
      this.userId = user?.id || null;

      if (user?.role) {
        this.isAdminOrCompetenceLeader = user.role === UserRole.ADMIN || user.role === UserRole.COMPETENCE_LEADER;
        this.isLecturer = user.role === UserRole.LECTURER;

        // Start checking for inactive users if admin or competence leader
        if (this.isAdminOrCompetenceLeader) {
          this.loadInactiveUsersCount();
        }
      } else {
        this.isAdminOrCompetenceLeader = false;
        this.isLecturer = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadInactiveUsersCount() {
    if (this.isAdminOrCompetenceLeader) {
      this.userService.getInactiveUsersCount().subscribe(
        count => this.inactiveUsersCount = count,
        error => console.error('Error loading inactive users:', error)
      );
    }
  }

  toggleDropdown(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;

    // Close user dropdown when Future Skills dropdown is opened
    if (this.isDropdownOpen) {
      this.isUserDropdownOpen = false;
    }
  }

  toggleUserDropdown(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.isUserDropdownOpen = !this.isUserDropdownOpen;


    if (this.isUserDropdownOpen) {
      this.isDropdownOpen = false;
    }
  }

  closeFutureSkillsDropdown(): void {
    this.isDropdownOpen = false;
  }

  closeUserDropdown(): void {
    this.isUserDropdownOpen = false;
  }

  onDropdownItemClick(event: Event): void {
    event.stopPropagation();
    this.closeFutureSkillsDropdown();
    this.closeUserDropdown();
  }

  isRouteActive(route: string): boolean {
    const currentUrl = this.router.url.split('?')[0]; // Ignore query parameters
    return currentUrl === route ||
           currentUrl === route + '/' ||
           currentUrl.startsWith(route + '/');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  /**
   * Navigates directly to the edit page of the current user's profile
   */
  editOwnProfile(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.userId) {
      console.log('Navigate to profile edit page for user:', this.userId);

      // Explicit navigation to the edit path
      const url = `/users/${this.userId}/edit`;
      console.log('Navigation URL:', url);

      // Close dropdown
      this.isUserDropdownOpen = false;

      // Navigate to the edit path
      this.router.navigateByUrl(url);
    } else {
      console.error('No user ID available');
    }
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }
}

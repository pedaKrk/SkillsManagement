import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';
import { UserService } from '../../core/services/user/user.service';
import { UserRole } from '../../models/enums/user-roles.enum';
import { interval, Subscription } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
import { NotificationService } from '../../core/services/notification/notification.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  username: string | null = null;
  userId: string | null = null;
  isAdmin = false;
  isCompetenceLeader = false;
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
    private notificationService: NotificationService
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
        this.isAdmin = user.role === UserRole.ADMIN;
        this.isCompetenceLeader = user.role === UserRole.COMPETENCE_LEADER;
        this.isLecturer = user.role === UserRole.LECTURER;

        // Start checking for inactive users if admin or competence leader
        if (this.isAdmin || this.isCompetenceLeader) {
          this.loadInactiveUsersCount();
        }
      } else {
        this.isAdmin = false;
        this.isCompetenceLeader = false;
        this.isLecturer = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadInactiveUsersCount() {
    if (this.isAdmin || this.isCompetenceLeader) {
      this.userService.getInactiveUsersCount().subscribe(
        count => this.inactiveUsersCount = count,
        error => console.error('Fehler beim Laden der inaktiven Benutzer:', error)
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const dropdown = document.querySelector('.dropdown');
    const userDropdown = document.querySelector('.user-dropdown');
    
    if (this.isDropdownOpen && dropdown && !dropdown.contains(target)) {
      this.isDropdownOpen = false;
    }
    
    if (this.isUserDropdownOpen && userDropdown && !userDropdown.contains(target)) {
      this.isUserDropdownOpen = false;
    }
  }

  onDropdownItemClick(event: Event): void {
    event.stopPropagation();
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
      console.log('Navigiere zur Profilbearbeitungsseite für Benutzer:', this.userId);
      
      // Explicit navigation to the edit path
      const url = `/users/${this.userId}/edit`;
      console.log('Navigation URL:', url);
      
      // Close dropdown
      this.isUserDropdownOpen = false;
      
      // Navigate to the edit path
      this.router.navigateByUrl(url);
    } else {
      console.error('Keine Benutzer-ID verfügbar');
    }
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }
} 
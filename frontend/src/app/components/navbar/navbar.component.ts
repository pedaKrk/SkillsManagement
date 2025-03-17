import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  isLoggedIn = false;
  username: string | null = null;
  userId: string | null = null;
  isAdmin = false;
  isDropdownOpen = false;
  isUserDropdownOpen = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.isLoggedIn = !!user;
      this.username = user?.username || null;
      this.userId = user?.id || null;
      
      if (user?.role) {
        this.isAdmin = user.role === 'Admin';
      } else {
        this.isAdmin = false;
      }
    });
  }

  toggleDropdown(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
    
    // Benutzer-Dropdown schließen, wenn Future Skills Dropdown geöffnet wird
    if (this.isDropdownOpen) {
      this.isUserDropdownOpen = false;
    }
  }
  
  toggleUserDropdown(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.isUserDropdownOpen = !this.isUserDropdownOpen;
    
    // Future Skills Dropdown schließen, wenn Benutzer-Dropdown geöffnet wird
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
    return this.router.url === route;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
} 
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
  isAdmin = false;
  isDropdownOpen = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Subscribe to the current user observable to update the navbar when login status changes
    this.authService.currentUser.subscribe(user => {
      this.isLoggedIn = !!user;
      this.username = user?.username || null;
   
      if (user?.role) {
        // direct check for 'Admin' (with capital A)
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
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const dropdown = document.querySelector('.dropdown');
    
    if (this.isDropdownOpen && dropdown && !dropdown.contains(target)) {
      this.isDropdownOpen = false;
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
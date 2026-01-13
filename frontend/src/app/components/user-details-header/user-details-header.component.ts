import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { User } from '../../models/user.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-user-details-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule
  ],
  templateUrl: './user-details-header.component.html',
  styleUrl: './user-details-header.component.scss'
})
export class UserDetailsHeaderComponent {
  @Input() user: User | null = null;
  @Input() isAdmin: boolean = false;
  @Input() isOwnProfile: boolean = false;
  @Input() showInitialsOnError: boolean = false;

  @Output() editUser = new EventEmitter<void>();
  @Output() sendEmail = new EventEmitter<void>();
  @Output() imageError = new EventEmitter<void>();

  /**
   * Returns the initials of the user (for the avatar)
   */
  getUserInitials(): string {
    if (!this.user) {
      console.log('No user object available');
      return '';
    }

    if (!this.user.firstName || !this.user.lastName) {
      console.log('Missing firstName or lastName:', {
        firstName: this.user.firstName,
        lastName: this.user.lastName
      });
      return '';
    }

    const initials = (this.user.firstName.charAt(0) + this.user.lastName.charAt(0)).toUpperCase();
    return initials;
  }

  /**
   * Returns the formatted name of the user
   */
  getUserFullName(): string {
    if (!this.user) return '';
    return `${this.user.title ? this.user.title + ' ' : ''}${this.user.firstName} ${this.user.lastName}`;
  }

  /**
   * Returns the formatted employment type
   */
  getEmploymentType(): string {
    if (!this.user) return '';
    return this.user.employmentType === 'Internal' ? 'Intern' : 'Extern';
  }

  /**
   * Returns the german role name
   * @returns The german role name
   */
  getFormattedRole(): string {
    if (!this.user) {
      return '';
    }
    return this.user.role.replace('_', ' ');
  }

  /**
   * Returns the full URL for a profile image
   * @param profileImageUrl The relative URL of the profile image
   * @returns The full URL of the profile image
   */
  getProfileImageUrl(profileImageUrl: string): string {
    if (!profileImageUrl) return '';

    // If the URL is already absolute (starts with http or https), use it directly
    if (profileImageUrl.startsWith('http')) {
      return profileImageUrl;
    }

    // If the URL starts with a slash, remove it
    const cleanUrl = profileImageUrl.startsWith('/') ? profileImageUrl.substring(1) : profileImageUrl;

    // Create the full URL
    // Use the base URL without the API path
    const baseUrl = environment.apiUrl.split('/api/v1')[0];

    // Use a direct URL to the backend server
    const fullUrl = `${baseUrl}/${cleanUrl}`;
    console.log('Profilbild-URL:', fullUrl);

    // Use a static URL without timestamp to avoid Angular errors
    return fullUrl;
  }

  /**
   * Handles errors when loading the profile image
   */
  handleImageError(): void {
    console.log('Fehler beim Laden des Profilbilds');
    this.imageError.emit();
  }

  /**
   * Emits edit user event
   */
  onEditUser(): void {
    this.editUser.emit();
  }

  /**
   * Emits send email event
   */
  onSendEmail(): void {
    this.sendEmail.emit();
  }
}


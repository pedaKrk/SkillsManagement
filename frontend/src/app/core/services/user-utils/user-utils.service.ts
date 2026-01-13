import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class UserUtilsService {

  constructor(private translateService: TranslateService) { }

  /**
   * Creates a formal name from user data
   * Formats: "Title FirstName LastName" or falls back to username or translated "Unknown User"
   * @param user User object with title, firstName, lastName, and/or username
   * @returns Formatted name string
   */
  createFormalName(user: any): string {
    const parts = [];
    if (user.title) {
      parts.push(user.title);
    }
    if (user.firstName) {
      parts.push(user.firstName);
    }
    if (user.lastName) {
      parts.push(user.lastName);
    }
    if (parts.length > 0) {
      return parts.join(' ');
    }
    // Use username or fallback to translated unknown user text
    // Note: For synchronous use, we use instant() method
    return user.username || this.translateService.instant('PROFILE.UNKNOWN_USER') || 'Unknown User';
  }
}

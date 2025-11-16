import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../../../models/user.model';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  private apiUrl = `${environment.apiUrl}/email`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Gets the authentication headers for API requests
   */
  private getAuthHeaders(): HttpHeaders {
    const currentUser = this.authService.currentUserValue;
    if (currentUser && currentUser.token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${currentUser.token}`
      });
    }
    return new HttpHeaders();
  }

  /**
   * Sends an email to selected users directly from the system
   * @param users The selected users
   * @param subject The email subject
   * @param message The email content
   * @returns Observable with the server response
   */
  sendEmailToUsers(users: User[], subject: string, message: string): Observable<any> {
    const recipients = users.map(user => user.email);
    
    return this.http.post(`${this.apiUrl}/send`, {
      recipients,
      subject,
      message,
      sender: 'technikumwienmailservice@gmail.com' // Fixed sender
    }, { headers: this.getAuthHeaders() });
  }
  
  /**
   * Opens the user's default email client with prefilled recipients
   * @param users The selected users
   * @param subject The email subject (optional)
   * @param body The email content (optional)
   */
  openEmailClient(users: User[], subject: string = '', body: string = ''): void {
    const recipients = users.map(user => user.email).join(',');
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    
    window.location.href = `mailto:${recipients}?subject=${encodedSubject}&body=${encodedBody}`;
  }

  /**
   * Loads the email template for user list emails
   * @param customMessage Optional custom message to include in the template
   * @returns Observable with the template response
   */
  getUserListEmail(customMessage?: string): Observable<any> {
    const headers = this.getAuthHeaders();
    let url = `${this.apiUrl}/user-list-email`;
    
    if (customMessage) {
      url += `?customMessage=${encodeURIComponent(customMessage)}`;
    }
    
    return this.http.get(url, { headers });
  }
} 
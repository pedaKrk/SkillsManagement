import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ManageProgressService {
  private apiUrl = 'http://localhost:3000/api/v1/email';

  constructor(private http: HttpClient) {}

  /**
   * Loads the email template for a given user and skill name
   */
  getFutureSkillStatusEmail(userName: string, skillName: string): Observable<any> {
    const token = localStorage.getItem('accessToken');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token || ''}`
    });

    return this.http.get(
      `${this.apiUrl}/future-skill-status-email?userName=${encodeURIComponent(userName)}&skillName=${encodeURIComponent(skillName)}`,
      { headers }
    );
  }

  /**
   * Sends an email to recipients (used in email modal)
   */
  sendEmail(payload: { recipients: string[]; subject: string; message: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/send-email`, payload);
  }
}

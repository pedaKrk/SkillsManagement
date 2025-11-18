import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import {AuthService} from '../auth/auth.service';
import {API_CONFIG} from '../../config/api.config';

@Injectable({ providedIn: 'root' })
export class ManageProgressService {
  //private apiUrl = 'http://localhost:3000/api/v1/email'
  private apiUrl = 'http://localhost:3000/api/v1/future-skills';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const currentUser = this.authService.currentUserValue;
    if (currentUser?.token) {
      return new HttpHeaders({ 'Authorization': `Bearer ${currentUser.token}` });
    }
    return new HttpHeaders();
  }

  getAllFutureSkills(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }


  createSkill(payload: any): Observable<any> {
    return this.http.post(this.apiUrl, payload);
  }

  getAllLecturers(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>('http://localhost:3000/api/v1/users/', { headers });
  }


  fetchAllSkillNames(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:3000/api/v1/skills');
  }

  fetchAllSkillLevels(): Observable<string[]> {
    return this.http.get<string[]>('http://localhost:3000/api/v1/future-skills/skill-levels');
  }

  updateSkill(id: string, updatedSkill: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, updatedSkill);
  }

  deleteSkill(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  addFutureSkillToSkills(futureSkillId: string, userId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(
      `${API_CONFIG.baseUrl}/skills/from-future/${futureSkillId}`,
      { userId },
      { headers }
    );
  }






  /**
   * Loads the email template for a given user and skill name
   */
  getFutureSkillStatusEmail(userName: string, skillName: string): Observable<any> {
    const headers = this.getAuthHeaders();
    const emailApiUrl = 'http://localhost:3000/api/v1/email';

    return this.http.get(
      `${emailApiUrl}/future-skill-status-email?userName=${encodeURIComponent(userName)}&skillName=${encodeURIComponent(skillName)}`,
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

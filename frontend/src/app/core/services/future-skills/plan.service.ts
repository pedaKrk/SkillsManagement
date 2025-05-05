import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import { Observable } from 'rxjs';
import {AuthService} from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class PlanService {
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
}

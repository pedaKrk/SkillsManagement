import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {API_CONFIG} from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class DashboardService {

  private apiUrl = 'http://localhost:3000/api/v1/dashboard';  // Adjust this path!

  constructor(private http: HttpClient) {}

  getSkillsLevelMatrix(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/skills-level-matrix`);
  }

  getSkillsByLevel(): Observable<any> {
    return this.http.get(`${this.apiUrl}/skills-by-level`);
  }

  getSkillsPopularity(): Observable<any> {
    return this.http.get(`${this.apiUrl}/skills-popularity`);
  }

  getFieldsPopularity(): Observable<any> {
    return this.http.get(`${this.apiUrl}/fields-popularity`);
  }

  getUserFutureSkillLevelMatrix(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/user/${userId}/future-skills-level-matrix`);
  }

  getUserSkillDistribution(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/user/${userId}/skills/distribution`);
  }

  getGoalsPerformance(): Observable<any> {
    return this.http.get(`${this.apiUrl}/goals-performance`);
  }

  getLecturersSkillFields(): Observable<any> {
    return this.http.get(`${this.apiUrl}/lecturers-skill-fields`);
  }

}

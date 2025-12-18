import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {API_CONFIG} from '../config/api.config';
import {catchError} from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class DashboardService {

  constructor(private http: HttpClient) {}

  getSkillsLevelMatrix(): Observable<any> {
    return this.http.get<any>(`${API_CONFIG.baseUrl}/${API_CONFIG.endpoints.dashboard.skillsLevelMatrix}`).pipe(
      catchError(error => {
        console.error('Error loading SkillsLevelMatrix:', error);
        return throwError(() => new Error('Error getting SkillsLevelMatrix'));
      })
    );
  }

  getSkillsByLevel(): Observable<any> {
    return this.http.get(`${API_CONFIG.baseUrl}/${API_CONFIG.endpoints.dashboard.skillsByLevel}`).pipe(
      catchError(error => {
        console.error('Error loading Skills by Level:', error);
        return throwError(() => new Error('Error getting Skills by Level'));
      })
    );
  }

  getSkillsPopularity(): Observable<any> {
    return this.http.get(`${API_CONFIG.baseUrl}/${API_CONFIG.endpoints.dashboard.skillsPopularity}`).pipe(
      catchError(error => {
        console.error('Error loading Skills popularity:', error);
        return throwError(() => new Error('Error getting Skills popularity'));
      })
    );
  }

  getFieldsPopularity(): Observable<any> {
    return this.http.get(`${API_CONFIG.baseUrl}/${API_CONFIG.endpoints.dashboard.fieldsPopularity}`).pipe(
      catchError(error => {
        console.error('Error loading Fields popularity:', error);
        return throwError(() => new Error('Error getting Fields popularity'));
      })
    );
  }

  getUserFutureSkillLevelMatrix(userId: string): Observable<any> {
    return this.http.get(`${API_CONFIG.baseUrl}/${API_CONFIG.endpoints.dashboard.userFutureSkillLevelMatrix(userId)}`).pipe(
      catchError(error => {
        console.error(`Error loading FutureSkillsLevelMatrix for user ${userId}:`, error);
        return throwError(() => new Error('Error getting FutureSkillsLevelMatrix'));
      })
    );
  }

  getUserSkillDistribution(userId: string): Observable<any> {
    return this.http.get(`${API_CONFIG.baseUrl}/${API_CONFIG.endpoints.dashboard.userSkillsDistribution(userId)}`).pipe(
      catchError(error => {
        console.error(`Error loading SkillsDistribution for user ${userId}:`, error);
        return throwError(() => new Error('Error getting SkillsDistribution'));
      })
    );
  }
}

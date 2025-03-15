import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, catchError, map } from 'rxjs';
import { Skill } from '../../../models/user.model';
import { API_CONFIG } from '../../config/api.config';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class SkillService {
  // Cache for skills, to avoid repeated API calls
  private skillsCache: Map<string, Skill> = new Map();
  
  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // Auth Headers
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
   * Gets all skills from the server
   * @returns Observable with all skills
   */
  getAllSkills(): Observable<Skill[]> {
    return this.http.get<Skill[]>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.skills.all}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error fetching skills:', error);
        return of([]);
      })
    );
  }

  /**
   * Gets a skill by its ID
   * @param skillId The ID of the skill
   * @returns Observable with the skill or null if not found
   */
  getSkillById(skillId: string): Observable<Skill | null> {
    // check the cache first
    if (this.skillsCache.has(skillId)) {
      return of(this.skillsCache.get(skillId) as Skill);
    }
    
    return this.http.get<Skill>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.skills.all}/${skillId}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(skill => {
        // store in cache
        this.skillsCache.set(skillId, skill);
        return skill;
      }),
      catchError(error => {
        console.error(`Error fetching skill with ID ${skillId}:`, error);
        return of(null);
      })
    );
  }
} 
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, catchError, map } from 'rxjs';
import { Skill } from '../../../models/skill.model';
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

  /**
   * Creates a new skill
   * @param skillData The skill data to create
   * @returns Observable with the created skill
   */
  createSkill(skillData: Partial<Skill>): Observable<Skill> {
    return this.http.post<Skill>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.skills.all}`,
      skillData,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(skill => {
        // Clear cache to force refresh
        this.skillsCache.clear();
        return skill;
      }),
      catchError(error => {
        console.error('Error creating skill:', error);
        throw error;
      })
    );
  }

  /**
   * Updates an existing skill
   * @param skillId The ID of the skill to update
   * @param skillData The updated skill data
   * @returns Observable with the updated skill
   */
  updateSkill(skillId: string, skillData: Partial<Skill>): Observable<Skill> {
    return this.http.put<Skill>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.skills.all}/${skillId}`,
      skillData,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(skill => {
        // Update cache
        this.skillsCache.set(skillId, skill);
        return skill;
      }),
      catchError(error => {
        console.error(`Error updating skill with ID ${skillId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Deletes a skill
   * @param skillId The ID of the skill to delete
   * @returns Observable with the deletion result
   */
  deleteSkill(skillId: string): Observable<any> {
    return this.http.delete(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.skills.all}/${skillId}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(() => {
        // Remove from cache and clear cache to force refresh
        this.skillsCache.delete(skillId);
        this.skillsCache.clear();
        return true;
      }),
      catchError(error => {
        console.error(`Error deleting skill with ID ${skillId}:`, error);
        throw error;
      })
    );
  }
} 
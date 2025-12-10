import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, catchError, map, BehaviorSubject, combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, startWith } from 'rxjs/operators';
import { Skill } from '../../../models/skill.model';
import { API_CONFIG } from '../../config/api.config';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class SkillService {
  // Cache for skills, to avoid repeated API calls
  private skillsCache: Map<string, Skill> = new Map();
  
  // Cache for all skills list
  private allSkillsCache: Skill[] | null = null;
  private allSkillsSubject = new BehaviorSubject<Skill[]>([]);
  public allSkills$ = this.allSkillsSubject.asObservable();

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
    // Return cached skills if available
    if (this.allSkillsCache) {
      return of(this.allSkillsCache);
    }

    return this.http.get<Skill[]>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.skills.all}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(skills => {
        // Validate and cache skills
        if (skills && Array.isArray(skills)) {
          this.allSkillsCache = skills;
          this.allSkillsSubject.next(skills);
          return skills;
        } else {
          console.error('Received skills are not an array:', skills);
          this.allSkillsCache = [];
          this.allSkillsSubject.next([]);
          return [];
        }
      }),
      catchError(error => {
        console.error('Error fetching skills:', error);
        this.allSkillsCache = [];
        this.allSkillsSubject.next([]);
        return of([]);
      })
    );
  }

  /**
   * Loads skills from the server and caches them
   * @returns Observable with loading state and skills
   */
  loadSkills(): Observable<{ skills: Skill[], error: string | null }> {
    // Return cached skills if available
    if (this.allSkillsCache) {
      return of({ skills: this.allSkillsCache, error: null });
    }

    return this.http.get<Skill[]>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.skills.all}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(skills => {
        if (skills && Array.isArray(skills)) {
          this.allSkillsCache = skills;
          this.allSkillsSubject.next(skills);
          return { skills, error: null };
        } else {
          const error = 'Ungültiges Datenformat für Skills erhalten.';
          this.allSkillsCache = [];
          this.allSkillsSubject.next([]);
          return { skills: [], error };
        }
      }),
      catchError(error => {
        console.error('Fehler beim Laden der Skills:', error);
        let errorMessage = 'Skills konnten nicht geladen werden. ';
        
        if (error.status === 0) {
          errorMessage += 'Keine Verbindung zum Server möglich. Bitte überprüfen Sie Ihre Internetverbindung.';
        } else if (error.status === 404) {
          errorMessage += 'Skills-Endpunkt nicht gefunden.';
        } else if (error.status === 500) {
          errorMessage += 'Serverfehler beim Laden der Skills.';
        } else {
          errorMessage += 'Bitte versuchen Sie es später erneut.';
        }
        
        this.allSkillsCache = [];
        this.allSkillsSubject.next([]);
        return of({ skills: [], error: errorMessage });
      })
    );
  }

  /**
   * Gets filtered skills based on a search term
   * Uses RxJS operators for efficient filtering with debouncing
   * @param searchTerm$ Observable of search terms
   * @returns Observable with filtered skills and loading/error state
   */
  getFilteredSkills(searchTerm$: Observable<string>): Observable<{ 
    skills: Skill[], 
    isLoading: boolean, 
    error: string | null 
  }> {
    // Load skills first if not cached
    const skills$ = this.allSkillsCache 
      ? of({ skills: this.allSkillsCache, isLoading: false, error: null })
      : this.loadSkills().pipe(
          map(result => ({ ...result, isLoading: false })),
          startWith({ skills: [], isLoading: true, error: null })
        );

    // Combine loaded skills with search term
    return combineLatest([
      skills$,
      searchTerm$.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        startWith('')
      )
    ]).pipe(
      map(([result, searchTerm]) => ({
        skills: this.filterSkillsByTerm(result.skills, searchTerm),
        isLoading: result.isLoading,
        error: result.error
      }))
    );
  }

  /**
   * Filters skills by search term
   * @param skills Array of skills to filter
   * @param searchTerm Search term
   * @returns Filtered skills array
   */
  private filterSkillsByTerm(skills: Skill[], searchTerm: string): Skill[] {
    if (!searchTerm.trim()) {
      return [...skills];
    }

    const term = searchTerm.toLowerCase().trim();
    return skills.filter(skill => 
      skill.name.toLowerCase().includes(term)
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
   * Gets all root skills from the server
   * @return Observable<Skill[]>
   */
  getRootSkills(): Observable<Skill[]> {
    return this.http.get<Skill[]>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.skills.root}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error fetching root skills:', error);
        return of([]);
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

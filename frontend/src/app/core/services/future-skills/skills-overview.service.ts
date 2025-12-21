import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class SkillsOverviewService {

  private apiUrl = 'http://localhost:3000/api/v1/users';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.currentUserValue?.token;
    return token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
  }

  /**
   * Returns flattened list:
   * { user: string, skill: string, level: string }
   */
  getSkillsOverview(): Observable<any[]> {
    const headers = this.getAuthHeaders();

    return this.http.get<any[]>(this.apiUrl, { headers }).pipe(
      map(users => {
        const rows: any[] = [];

        users.forEach(user => {
          if (user.skills && user.skills.length > 0) {
            user.skills.forEach((skill: any) => {
              const latestLevel =
                skill.levelHistory?.length > 0
                  ? skill.levelHistory[skill.levelHistory.length - 1].level
                  : '—';

              rows.push({
                user: `${user.firstName} ${user.lastName}`,
                skill: skill.skill?.name ?? '—',
                level: latestLevel
              });
            });
          }
        });

        return rows;
      })
    );
  }
}

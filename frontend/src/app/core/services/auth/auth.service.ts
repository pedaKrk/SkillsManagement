import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthUser, LoginResponse } from '../../../models/auth.model';
import { API_CONFIG } from '../../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<AuthUser | null>;
  public currentUser: Observable<AuthUser | null>;

  constructor(private http: HttpClient) {
    this.currentUserSubject = new BehaviorSubject<AuthUser | null>(
      JSON.parse(localStorage.getItem('currentUser') || 'null')
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  // Register a new user
  register(userData: any) {
    return this.http.post(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.register}`,
      userData
    );
  }

  // Admin creates a new user
  adminCreateUser(userData: any) {
    const headers = new HttpHeaders({
      'x-admin-creation': 'true'
    });
    
    return this.http.post(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.register}`,
      userData,
      { headers }
    );
  }

  login(identifier: string, password: string) {
    return this.http.post<LoginResponse>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.login}`,
      { identifier, password }
    ).pipe(map(response => {
      console.log('Raw login response:', response);
      
      // user id is in the response.user object
      let userId = response.user._id || response.user.id || '';
      
      // If no ID is found in the user object, try to extract it from the token
      if (!userId && response.token) {
        try {
          // The token consists of three parts, separated by dots
          const tokenParts = response.token.split('.');
          if (tokenParts.length === 3) {
            // The second part contains the payload, which we need to decode
            const payload = JSON.parse(atob(tokenParts[1]));
            if (payload.id) {
              userId = payload.id;
              console.log('Extracted user ID from token:', userId);
            }
          }
        } catch (error) {
          console.error('Failed to extract user ID from token:', error);
        }
      }
      
      const user: AuthUser = {
        id: userId,
        email: response.user.email,
        username: response.user.username,
        role: response.user.role,
        token: response.token
      };
      
      console.log('Processed user object:', user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      this.currentUserSubject.next(user);
      return user;
    }));
  }

  logout() {
    const currentUser = this.currentUserValue;
    if (currentUser?.token) {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${currentUser.token}`
      });
      
      this.http.post(
        `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.logout}`,
        {},
        { headers }
      ).subscribe();
    }
    
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  /**
   * Checks if the provided userId belongs to the current logged in user
   * @param userId The user ID to check
   * @returns true if it's the current user's profile
   */
  isOwnProfile(userId: string): boolean {
    const currentUser = this.currentUserValue;
    if (!currentUser) return false;
    
    return currentUser.id === userId;
  }
} 
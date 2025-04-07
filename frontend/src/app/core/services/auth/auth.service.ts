import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, timer } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { AuthUser, LoginResponse } from '../../../models/auth.model';
import { API_CONFIG } from '../../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<AuthUser | null>;
  private _needsPasswordChange: boolean = false;
  public currentUser: Observable<AuthUser | null>;
  private checkStatusInterval: any;

  constructor(private http: HttpClient) {
    this.currentUserSubject = new BehaviorSubject<AuthUser | null>(
      JSON.parse(localStorage.getItem('currentUser') || 'null')
    );
    this.currentUser = this.currentUserSubject.asObservable();
    
    // Start periodic status check if user is logged in
    if (this.currentUserValue) {
      this.startStatusCheck();
    }
  }

  private startStatusCheck() {
    // Check every 5 minutes
    this.checkStatusInterval = timer(0, 300000).pipe(
      switchMap(() => this.checkUserStatus())
    ).subscribe();
  }

  private stopStatusCheck() {
    if (this.checkStatusInterval) {
      this.checkStatusInterval.unsubscribe();
    }
  }

  private checkUserStatus(): Observable<any> {
    const currentUser = this.currentUserValue;
    if (!currentUser) return new Observable();

    return this.http.get(
      `${API_CONFIG.baseUrl}/users/${currentUser.id}/status`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map((response: any) => {
        if (!response.isActive) {
          console.log('User has been deactivated');
          this.logout();
        }
      }),
      catchError(error => {
        if (error.status === 401 || error.status === 403) {
          this.logout();
        }
        return throwError(() => error);
      })
    );
  }

  public get currentUserValue(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  public get needsPasswordChange(): boolean {
    return this._needsPasswordChange;
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

  login(identifier: string, password: string): Observable<any> {
    return this.http.post<LoginResponse>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.login}`,
      { identifier, password }
    ).pipe(
      map(response => {
        const userId = response.user._id || response.user.id;
        if (!userId) {
          throw new Error('Keine Benutzer-ID in der Antwort gefunden');
        }

        const user: AuthUser = {
          id: userId,
          email: response.user.email,
          username: response.user.username,
          role: response.user.role,
          token: response.token,
          mustChangePassword: response.user.mustChangePassword
        };
        
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
        
        if (user.mustChangePassword) {
          this._needsPasswordChange = true;
        }

        // Start status check after successful login
        this.startStatusCheck();
        
        return user;
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 403 && error.error?.message === "User needs to change default password") {
          // create temporary user - use the data from the server response
          const tempUser: AuthUser = {
            id: error.error.user.id,
            email: error.error.user.email,
            username: error.error.user.username,
            role: error.error.user.role,
            token: error.error?.token || '',
            mustChangePassword: true
          };
          
          this._needsPasswordChange = true;
          localStorage.setItem('currentUser', JSON.stringify(tempUser));
          this.currentUserSubject.next(tempUser);
        }
        return throwError(() => error);
      })
    );
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
    this._needsPasswordChange = false;
    
    // Stop status check on logout
    this.stopStatusCheck();
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

  changePassword(currentPassword: string, newPassword: string, email: string, confirmPassword: string) {
    const currentUser = this.currentUserValue;
    let headers = new HttpHeaders();

    // if user is logged in and has a token, add it
    if (currentUser?.token) {
      headers = headers.set('Authorization', `Bearer ${currentUser.token}`);
    }

    // if needsPasswordChange is true, add a special header
    if (this._needsPasswordChange) {
      headers = headers.set('x-password-change-required', 'true');
    }

    return this.http.post(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.users.changePassword}`,
      { 
        email,
        currentPassword, 
        newPassword,
        confirmPassword
      },
      { headers }
    ).pipe(
      map(response => {
        // after successful password change reset
        this._needsPasswordChange = false;
        this.currentUserSubject.next(null);
        localStorage.removeItem('currentUser');
        return response;
      })
    );
  }

  /**
   * Request password reset for a user
   * @param email The email address of the user
   */
  requestPasswordReset(email: string): Observable<any> {
    return this.http.post(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.resetPassword}`,
      { email }
    );
  }

  private getAuthHeaders(): HttpHeaders {
    const currentUser = this.currentUserValue;
    return new HttpHeaders({
      'Authorization': `Bearer ${currentUser?.token}`
    });
  }
} 
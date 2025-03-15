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
      const user: AuthUser = {
        id: response.user.id || response.user._id || '',
        email: response.user.email,
        username: response.user.username,
        role: response.user.role,
        token: response.token
      };
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
} 
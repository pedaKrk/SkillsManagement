import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../../../models/user.model';
import { API_CONFIG } from '../../config/api.config';
import { AuthService } from '../auth/auth.service';
import { catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
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

  // Get User Profile
  getUserProfile(): Observable<User> {
    return this.http.get<User>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.users.profile}`,
      { headers: this.getAuthHeaders() }
    );
  }

  // Get All Users (only for Admins)
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.users.all}`,
      { headers: this.getAuthHeaders() }
    );
  }

  // Update User
  updateUser(userId: string, userData: Partial<User>): Observable<User> {
    return this.http.put<User>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.users.all}/${userId}`,
      userData,
      { headers: this.getAuthHeaders() }
    );
  }

  // Delete User
  deleteUser(userId: string): Observable<any> {
    return this.http.delete(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.users.all}/${userId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Gets a user by its ID
   * @param userId The ID of the user
   * @returns Observable with the user
   */
  getUserById(userId: string): Observable<User> {
    return this.http.get<User>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.users.all}/${userId}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error fetching user by ID:', error);
        return throwError(() => new Error('Failed to fetch user details'));
      })
    );
  }
} 
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../../../models/user.model';
import { API_CONFIG } from '../../config/api.config';
import { AuthService } from '../auth/auth.service';
import { catchError, throwError, timeout } from 'rxjs';

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
      `${API_CONFIG.baseUrl}/users/me`,
      { headers: this.getAuthHeaders() }
    );
  }

  // Get All Users (only for Admins)
  getAllUsers(): Observable<User[]> {
    console.log('UserService: Lade alle Benutzer...');
    console.log('Auth-Headers:', this.getAuthHeaders());
    
    return this.http.get<User[]>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.users.all}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(error => {
        console.error('UserService: Fehler beim Laden der Benutzer:', error);
        return throwError(() => error);
      })
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

  /**
   * loads a profile image for a user
   * @param userId the ID of the user
   * @param imageFile the image file
   * @returns Observable with the updated user
   */
  uploadProfileImage(userId: string, imageFile: File): Observable<User> {
    const formData = new FormData();
    formData.append('profileImage', imageFile);
    
    return this.http.post<User>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.users.all}/${userId}/profile-image`,
      formData,
      { headers: this.getAuthHeaders() }
    ).pipe(
      // longer timeout for larger uploads (2 minutes)
      timeout(120000),
      catchError(error => {
        console.error('Error uploading the profile image:', error);
        return throwError(() => new Error('Profilbild konnte nicht hochgeladen werden'));
      })
    );
  }
  
  /**
   * removes the profile image of a user
   * @param userId the ID of the user
   * @returns Observable with the updated user
   */
  removeProfileImage(userId: string): Observable<User> {
    return this.http.delete<User>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.users.all}/${userId}/profile-image`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Fehler beim Entfernen des Profilbilds:', error);
        return throwError(() => new Error('Profilbild konnte nicht entfernt werden'));
      })
    );
  }

  /**
   * Retrieves all inactive users
   */
  getInactiveUsers(): Observable<User[]> {
    return this.http.get<User[]>(
      `${API_CONFIG.baseUrl}/users/inactive`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Fehler beim Laden der inaktiven Benutzer:', error);
        return throwError(() => new Error('Inaktive Benutzer konnten nicht geladen werden'));
      })
    );
  }

  /**
   * Get count of inactive users
   */
  getInactiveUsersCount(): Observable<number> {
    return this.http.get<number>(
      `${API_CONFIG.baseUrl}/users/inactive/count`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Fehler beim Laden der Anzahl inaktiver Benutzer:', error);
        return throwError(() => new Error('Anzahl der inaktiven Benutzer konnte nicht geladen werden'));
      })
    );
  }

  /**
   * Activates a user
   */
  activateUser(userId: string): Observable<any> {
    return this.http.patch(
      `${API_CONFIG.baseUrl}/users/${userId}/activate`,
      {},
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Fehler beim Aktivieren des Benutzers:', error);
        return throwError(() => new Error('Benutzer konnte nicht aktiviert werden'));
      })
    );
  }

  /**
   * Deactivates a user
   */
  deactivateUser(userId: string): Observable<any> {
    return this.http.patch(
      `${API_CONFIG.baseUrl}/users/${userId}/deactivate`,
      {},
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Fehler beim Deaktivieren des Benutzers:', error);
        return throwError(() => new Error('Benutzer konnte nicht deaktiviert werden'));
      })
    );
  }
} 
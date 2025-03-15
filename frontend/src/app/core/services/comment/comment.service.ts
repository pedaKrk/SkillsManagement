import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Comment } from '../../../models/user.model';
import { API_CONFIG } from '../../config/api.config';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // Auth Headers
  private getAuthHeaders(): HttpHeaders {
    const currentUser = this.authService.currentUserValue;
    if (currentUser && currentUser.token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${currentUser.token}`,
        'Content-Type': 'application/json'
      });
    }
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  /**
   * Handles HTTP errors and returns a user-friendly error message
   */
  private handleError(error: HttpErrorResponse) {
    console.error('HTTP-Fehler aufgetreten:', error);
    
    let errorMessage = 'Ein unbekannter Fehler ist aufgetreten.';
    
    if (error.error instanceof ErrorEvent) {
      // client-side error
      errorMessage = `Fehler: ${error.error.message}`;
    } else {
      // server-side error
      errorMessage = `Fehlercode: ${error.status}, Nachricht: ${error.message}`;
      
      if (error.error && error.error.message) {
        errorMessage += ` - ${error.error.message}`;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Gets all comments for a user
   * @param userId The ID of the user
   * @returns Observable with the comments
   */
  getCommentsForUser(userId: string): Observable<any[]> {
    console.log(`Hole Kommentare für Benutzer mit ID: ${userId}`);
    
    return this.http.get<any[]>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.comments}/${userId}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(comments => console.log(`${comments.length} Kommentare erhalten`)),
      catchError(this.handleError)
    );
  }

  /**
   * Adds a comment to a user
   * @param userId The ID of the user
   * @param content The content of the comment
   * @returns Observable with the created comment
   */
  addCommentToUser(userId: string, content: string): Observable<any> {
    // we don't need to send the author-ID anymore, since it is extracted from the token
    console.log(`Add comment to user with ID: ${userId}`);
    
    return this.http.post<any>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.comments}/${userId}`,
      { content },
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(comment => console.log('Kommentar erfolgreich hinzugefügt:', comment)),
      catchError(this.handleError)
    );
  }

  /**
   * Updates a comment
   * @param userId The ID of the user
   * @param commentId The ID of the comment
   * @param content The new content of the comment
   * @returns Observable with the updated comment
   */
  updateComment(userId: string, commentId: string, content: string): Observable<any> {
    return this.http.put<any>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.comments}/${userId}/${commentId}`,
      { content },
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(comment => console.log('Kommentar erfolgreich aktualisiert:', comment)),
      catchError(this.handleError)
    );
  }

  /**
   * Deletes a comment
   * @param userId The ID of the user
   * @param commentId The ID of the comment
   * @returns Observable with the confirmation
   */
  deleteComment(userId: string, commentId: string): Observable<any> {
    return this.http.delete(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.comments}/${userId}/${commentId}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(response => console.log('Kommentar erfolgreich gelöscht:', response)),
      catchError(this.handleError)
    );
  }

  /**
   * Fügt eine Antwort zu einem Kommentar hinzu
   * @param userId Die ID des Benutzers
   * @param commentId Die ID des Kommentars
   * @param content Der Inhalt der Antwort
   * @returns Observable mit der erstellten Antwort
   */
  addReplyToComment(userId: string, commentId: string, content: string): Observable<any> {
    console.log(`Füge Antwort zu Kommentar mit ID ${commentId} für Benutzer mit ID ${userId} hinzu`);
    
    return this.http.post<any>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.comments}/${userId}/${commentId}/replies`,
      { content },
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(reply => console.log('Antwort erfolgreich hinzugefügt:', reply)),
      catchError(this.handleError)
    );
  }
} 
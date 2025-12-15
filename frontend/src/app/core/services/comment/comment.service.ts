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
   * Gets auth headers without Content-Type (for FormData)
   */
  private getAuthHeadersForFormData(): HttpHeaders {
    const currentUser = this.authService.currentUserValue;
    if (currentUser && currentUser.token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${currentUser.token}`
        // Don't set Content-Type - browser will set it with boundary for FormData
      });
    }
    return new HttpHeaders();
  }

  /**
   * Adds a comment to a user
   * @param userId The ID of the user
   * @param content The content of the comment
   * @param isRichText Whether the content is rich text (HTML)
   * @param attachments Optional file attachments
   * @returns Observable with the created comment
   */
  addCommentToUser(userId: string, content: string, isRichText: boolean = false, attachments: File[] = []): Observable<any> {
    console.log(`Add comment to user with ID: ${userId}, isRichText: ${isRichText}, attachments: ${attachments.length}`);
    
    // If there are attachments or rich text, use FormData
    if (attachments.length > 0 || isRichText) {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('isRichText', isRichText.toString());
      
      attachments.forEach((file, index) => {
        formData.append('attachments', file);
      });
      
      return this.http.post<any>(
        `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.comments}/${userId}`,
        formData,
        { headers: this.getAuthHeadersForFormData() }
      ).pipe(
        tap(comment => console.log('Kommentar erfolgreich hinzugefügt:', comment)),
        catchError(this.handleError)
      );
    }
    
    // Otherwise use JSON (backward compatible)
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
   * @param isRichText Whether the content is rich text (HTML)
   * @param attachments Optional file attachments (replaces existing attachments)
   * @returns Observable with the updated comment
   */
  updateComment(userId: string, commentId: string, content: string, isRichText: boolean = false, attachments: File[] = []): Observable<any> {
    // If there are attachments or rich text, use FormData
    if (attachments.length > 0 || isRichText) {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('isRichText', isRichText.toString());
      
      attachments.forEach((file) => {
        formData.append('attachments', file);
      });
      
      return this.http.put<any>(
        `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.comments}/${userId}/${commentId}`,
        formData,
        { headers: this.getAuthHeadersForFormData() }
      ).pipe(
        tap(comment => console.log('Kommentar erfolgreich aktualisiert:', comment)),
        catchError(this.handleError)
      );
    }
    
    // Otherwise use JSON (backward compatible)
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
   * @param isRichText Ob der Inhalt Rich Text (HTML) ist
   * @param attachments Optionale Dateianhänge
   * @returns Observable mit der erstellten Antwort
   */
  addReplyToComment(userId: string, commentId: string, content: string, isRichText: boolean = false, attachments: File[] = []): Observable<any> {
    console.log(`Füge Antwort zu Kommentar mit ID ${commentId} für Benutzer mit ID ${userId} hinzu, isRichText: ${isRichText}, attachments: ${attachments.length}`);
    
    // If there are attachments or rich text, use FormData
    if (attachments.length > 0 || isRichText) {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('isRichText', isRichText.toString());
      
      attachments.forEach((file) => {
        formData.append('attachments', file);
      });
      
      return this.http.post<any>(
        `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.comments}/${userId}/${commentId}/replies`,
        formData,
        { headers: this.getAuthHeadersForFormData() }
      ).pipe(
        tap(reply => console.log('Antwort erfolgreich hinzugefügt:', reply)),
        catchError(this.handleError)
      );
    }
    
    // Otherwise use JSON (backward compatible)
    return this.http.post<any>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.comments}/${userId}/${commentId}/replies`,
      { content },
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(reply => console.log('Antwort erfolgreich hinzugefügt:', reply)),
      catchError(this.handleError)
    );
  }

  /**
   * Updates a reply
   * @param userId The ID of the user
   * @param commentId The ID of the parent comment
   * @param replyId The ID of the reply
   * @param content The new content of the reply
   * @param isRichText Whether the content is rich text (HTML)
   * @param attachments Optional file attachments (replaces existing attachments)
   * @returns Observable with the updated reply
   */
  updateReply(userId: string, commentId: string, replyId: string, content: string, isRichText: boolean = false, attachments: File[] = []): Observable<any> {
    // If there are attachments or rich text, use FormData
    if (attachments.length > 0 || isRichText) {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('isRichText', isRichText.toString());
      
      attachments.forEach((file) => {
        formData.append('attachments', file);
      });
      
      return this.http.put<any>(
        `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.comments}/${userId}/${commentId}/replies/${replyId}`,
        formData,
        { headers: this.getAuthHeadersForFormData() }
      ).pipe(
        tap(reply => console.log('Antwort erfolgreich aktualisiert:', reply)),
        catchError(this.handleError)
      );
    }
    
    // Otherwise use JSON (backward compatible)
    return this.http.put<any>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.comments}/${userId}/${commentId}/replies/${replyId}`,
      { content },
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(reply => console.log('Antwort erfolgreich aktualisiert:', reply)),
      catchError(this.handleError)
    );
  }

  /**
   * Deletes a reply
   * @param userId The ID of the user
   * @param commentId The ID of the parent comment
   * @param replyId The ID of the reply
   * @returns Observable with the confirmation
   */
  deleteReply(userId: string, commentId: string, replyId: string): Observable<any> {
    return this.http.delete(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.comments}/${userId}/${commentId}/replies/${replyId}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(response => console.log('Antwort erfolgreich gelöscht:', response)),
      catchError(this.handleError)
    );
  }
} 
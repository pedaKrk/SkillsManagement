import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { User } from '../../../models/user.model';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { DialogService, FormDialogConfig } from '../dialog/dialog.service';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  private apiUrl = `${environment.apiUrl}/email`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private dialogService: DialogService,
    private translateService: TranslateService
  ) {}

  /**
   * Gets the authentication headers for API requests
   */
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
   * Sends an email to selected users directly from the system
   * @param users The selected users
   * @param subject The email subject
   * @param message The email content (HTML or plain text)
   * @param attachments Optional array of files to attach
   * @returns Observable with the server response
   */
  sendEmailToUsers(users: User[], subject: string, message: string, attachments: File[] = []): Observable<any> {
    const recipients = users.map(user => user.email);
    
    const formData = new FormData();
    formData.append('recipients', JSON.stringify(recipients));
    formData.append('subject', subject);
    formData.append('message', message);
    formData.append('sender', 'technikumwienmailservice@gmail.com');
    
    // Add attachments
    attachments.forEach((file, index) => {
      formData.append('attachments', file, file.name);
    });
    
    return this.http.post(`${this.apiUrl}/send`, formData, { 
      headers: this.getAuthHeaders().delete('Content-Type') // Let browser set Content-Type for FormData
    });
  }

  /**
   * Sends an email to a single user
   * @param userEmail The recipient's email address
   * @param subject The email subject
   * @param message The email content (HTML or plain text)
   * @param attachments Optional array of files to attach
   * @returns Observable with the server response
   */
  sendEmailToUser(userEmail: string, subject: string, message: string, attachments: File[] = []): Observable<any> {
    const formData = new FormData();
    formData.append('recipients', JSON.stringify([userEmail]));
    formData.append('subject', subject);
    formData.append('message', message);
    formData.append('sender', 'technikumwienmailservice@gmail.com');
    
    // Add attachments
    attachments.forEach((file, index) => {
      formData.append('attachments', file, file.name);
    });
    
    return this.http.post(`${this.apiUrl}/send`, formData, { 
      headers: this.getAuthHeaders().delete('Content-Type') // Let browser set Content-Type for FormData
    });
  }
  
  /**
   * Opens the user's default email client with prefilled recipients
   * @param users The selected users
   * @param subject The email subject (optional)
   * @param body The email content (optional)
   */
  openEmailClient(users: User[], subject: string = '', body: string = ''): void {
    const recipients = users.map(user => user.email).join(',');
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    
    window.location.href = `mailto:${recipients}?subject=${encodedSubject}&body=${encodedBody}`;
  }

  /**
   * Loads the email template for user list emails
   * @param customMessage Optional custom message to include in the template
   * @returns Observable with the template response
   */
  getUserListEmail(customMessage?: string): Observable<any> {
    const headers = this.getAuthHeaders();
    let url = `${this.apiUrl}/user-list-email`;
    
    if (customMessage) {
      url += `?customMessage=${encodeURIComponent(customMessage)}`;
    }
    
    return this.http.get(url, { headers });
  }

  /**
   * Converts plain text template to HTML for Quill editor
   * @param text Plain text template
   * @returns HTML formatted text
   */
  private convertPlainTextToHtml(text: string): string {
    if (!text || text.includes('<')) {
      return text;
    }
    
    return text
      .split('\n')
      .filter((line: string) => line.trim().length > 0)
      .map((line: string) => `<p>${line.trim()}</p>`)
      .join('');
  }

  /**
   * Extracts attachments from form data
   * @param attachments Form data attachments (can be FileList or File[])
   * @returns Array of File objects
   */
  private extractAttachments(attachments: any): File[] {
    if (!attachments) {
      return [];
    }
    
    if (attachments instanceof FileList) {
      return Array.from(attachments);
    } else if (Array.isArray(attachments)) {
      return attachments.filter((f: any) => f instanceof File) as File[];
    }
    
    return [];
  }

  /**
   * Creates the full name of a user
   * @param user User object
   * @returns Full name string
   */
  private getUserFullName(user: User): string {
    const parts = [];
    if (user.title) {
      parts.push(user.title);
    }
    if (user.firstName) {
      parts.push(user.firstName);
    }
    if (user.lastName) {
      parts.push(user.lastName);
    }
    return parts.length > 0 ? parts.join(' ') : user.username || '';
  }

  /**
   * Shows the email dialog for a user and handles the entire email sending process
   * This method orchestrates loading the template, showing the dialog, and sending the email
   * @param user The user to send the email to
   * @returns Observable that completes when the email is sent or the dialog is cancelled
   */
  showEmailDialogToUser(user: User): Observable<void> {
    return this.getUserListEmail().pipe(
      switchMap((res) => {
        if (!res.success) {
          this.dialogService.showError(
            this.translateService.instant('COMMON.ERROR') || 'Fehler',
            this.translateService.instant('PROFILE.EMAIL_TEMPLATE_ERROR') || 'E-Mail-Vorlage konnte nicht geladen werden.'
          );
          return of(undefined);
        }

        const defaultSubject = this.translateService.instant('USER.EMAIL_SUBJECT') || 'Nachricht vom Skills Management System';
        const defaultMessage = this.convertPlainTextToHtml(res.template || '');
        const userName = this.getUserFullName(user);
        const userEmail = user.email || '';

        const formConfig: FormDialogConfig = {
          title: this.translateService.instant('PROFILE.EMAIL_DIALOG_TITLE'),
          message: this.translateService.instant('PROFILE.EMAIL_DIALOG_INFO', { userName }),
          formFields: [
            {
              id: 'recipient',
              label: this.translateService.instant('PROFILE.EMAIL_RECIPIENT_LABEL'),
              type: 'text',
              defaultValue: `${userName} (${userEmail})`,
              required: true,
              disabled: true
            },
            {
              id: 'subject',
              label: this.translateService.instant('USER.EMAIL_SUBJECT_LABEL'),
              type: 'text',
              defaultValue: defaultSubject,
              required: true,
              placeholder: this.translateService.instant('USER.EMAIL_SUBJECT_PLACEHOLDER')
            },
            {
              id: 'message',
              label: this.translateService.instant('USER.EMAIL_MESSAGE_LABEL'),
              type: 'richtext',
              defaultValue: defaultMessage,
              required: true,
              placeholder: this.translateService.instant('USER.EMAIL_MESSAGE_PLACEHOLDER')
            },
            {
              id: 'attachments',
              label: this.translateService.instant('PROFILE.EMAIL_ATTACHMENTS_LABEL') || 'Anhänge',
              type: 'file',
              required: false,
              multiple: true,
              accept: '*/*'
            }
          ],
          submitText: this.translateService.instant('USER.EMAIL_SEND_BUTTON'),
          cancelText: this.translateService.instant('COMMON.CANCEL'),
          closeOnBackdropClick: false
        };

        return this.dialogService.showFormDialog(formConfig).pipe(
          switchMap((formData) => {
            if (!formData || !user.email) {
              return of(undefined);
            }

            const attachments = this.extractAttachments(formData.attachments);

            return this.sendEmailToUser(user.email, formData.subject, formData.message, attachments).pipe(
              switchMap(() => {
                this.dialogService.showSuccess({
                  title: this.translateService.instant('COMMON.SUCCESS') || 'Erfolg',
                  message: this.translateService.instant('PROFILE.EMAIL_SENT_SUCCESS') || 'E-Mail wurde erfolgreich gesendet.',
                  buttonText: this.translateService.instant('COMMON.OK') || 'OK'
                }).subscribe();
                return of(undefined);
              }),
              catchError((error) => {
                console.error('Error sending email:', error);
                this.dialogService.showError(
                  this.translateService.instant('COMMON.ERROR') || 'Fehler',
                  this.translateService.instant('PROFILE.EMAIL_SEND_ERROR') || 'E-Mail konnte nicht gesendet werden.'
                );
                return of(undefined);
              })
            );
          })
        );
      }),
      catchError((error) => {
        console.error('Error loading email template:', error);
        this.dialogService.showError(
          this.translateService.instant('COMMON.ERROR') || 'Fehler',
          this.translateService.instant('PROFILE.EMAIL_TEMPLATE_ERROR') || 'E-Mail-Vorlage konnte nicht geladen werden.'
        );
        return of(undefined);
      })
    );
  }
} 
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user/user.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { DialogService } from '../../core/services/dialog/dialog.service';
import { CommentService } from '../../core/services/comment/comment.service';
import { User, Comment, UserSkillEntry } from '../../models/user.model';
import { UserRole } from '../../models/enums/user-roles.enum';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.scss'
})
export class UserDetailsComponent implements OnInit {
  userId: string = '';
  user: User | null = null;
  isLoading: boolean = false;
  error: string | null = null;
  showInitialsOnError: boolean = false;
  
  // for comments
  newComment: string = '';
  comments: Comment[] = [];
  
  // answer to comments
  replyingToComment: Comment | null = null;
  replyText: string = '';
  
  // for filtering comments
  commentSearchTerm: string = '';
  selectedAuthor: string = '';
  dateFrom: string = '';
  dateTo: string = '';
  
  // for displaying long texts
  expandedComments: Set<string> = new Set<string>();
  expandedReplies: Set<string> = new Set<string>();
  maxTextLength: number = 150; // Maximum number of characters before text is truncated
  
  isAuthorDropdownOpen: boolean = false;
  
  // permissions
  canAddComments: boolean = false;
  isAdmin: boolean = false;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private authService: AuthService,
    private dialogService: DialogService,
    private commentService: CommentService
  ) {}
  
  ngOnInit(): void {
    // check if user is logged in
    const currentUser = this.authService.currentUserValue;
    console.log('Aktueller Benutzer:', currentUser);
    
    if (!currentUser || !currentUser.token) {
      console.warn('User is not logged in or token is missing');
      this.error = 'Sie müssen eingeloggt sein, um diese Seite anzuzeigen.';
      return;
    }
    
    // get user id from url
    this.route.params.subscribe(params => {
      this.userId = params['id'];
      if (this.userId) {
        this.loadUserDetails();
      }
    });
    
    // check permissions
    this.checkPermissions();
  }
  
  /**
   * loads user details from server
   */
  loadUserDetails(): void {
    this.isLoading = true;
    this.error = null;
    
    this.userService.getUserById(this.userId).subscribe({
      next: (user) => {
        this.user = user;
        this.loadComments();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading user details:', error);
        
        // show detailed error information
        if (error.status === 500) {
          this.error = 'Ein Serverfehler ist aufgetreten. Das Backend konnte den Benutzer nicht laden. Bitte kontaktieren Sie den Administrator.';
        } else if (error.status === 404) {
          this.error = 'Der angeforderte Benutzer wurde nicht gefunden.';
        } else if (error.status === 401) {
          this.error = 'Sie sind nicht berechtigt, diese Informationen anzuzeigen. Bitte melden Sie sich an.';
        } else {
          this.error = 'Fehler beim Laden der Benutzerdetails. Bitte versuchen Sie es später erneut.';
        }
        
        this.isLoading = false;
      }
    });
  }
  
  /**
   * loads comments for the user
   */
  loadComments(): void {
    this.isLoading = true;
    
    this.commentService.getCommentsForUser(this.userId).subscribe({
      next: (comments) => {
        // collect all unique user IDs
        const authorIds = new Set<string>();
        comments.forEach(comment => {
          if (comment.author?._id) {
            authorIds.add(comment.author._id);
          }
          if (comment.replies) {
            comment.replies.forEach((reply: { author?: { _id?: string } }) => {
              if (reply.author?._id) {
                authorIds.add(reply.author._id);
              }
            });
          }
        });

        // load user data for all authors
        Promise.all(
          Array.from(authorIds).map(authorId => this.userService.getUserById(authorId).toPromise())
        ).then(authors => {
          // create a map for quick access to user data
          const authorMap = new Map(
            authors
              .filter(author => author != null)
              .map(author => [author._id, author])
          );

          // convert comments to the correct format
          this.comments = comments.map(comment => {
            const author = comment.author?._id ? authorMap.get(comment.author._id) : null;
            const authorData = author || comment.author || { username: 'Unbekannt' };
            const authorName = this.createFormalName(authorData);

            // convert replies, if available
            const replies = comment.replies ? comment.replies.map((reply: any) => {
              const replyAuthor = reply.author?._id ? authorMap.get(reply.author._id) : null;
              const replyAuthorData = replyAuthor || reply.author || { username: 'Unbekannt' };
              const replyAuthorName = this.createFormalName(replyAuthorData);

              return {
                id: reply.id || reply._id || '',
                userId: this.userId,
                authorId: replyAuthorData._id || '',
                authorName: replyAuthorName,
                text: reply.content || '',
                createdAt: new Date(reply.time_stamp || new Date())
              };
            }) : [];

            return {
              id: comment.id || comment._id || '',
              userId: this.userId,
              authorId: authorData._id || '',
              authorName: authorName,
              text: comment.content || '',
              createdAt: new Date(comment.time_stamp || new Date()),
              replies: replies
            };
          });
          this.isLoading = false;
        });
      },
      error: (error) => {
        console.error('Error loading comments:', error);
        this.comments = [];
        this.isLoading = false;
      }
    });
  }
  
  /**
   * returns all unique authors who have written comments
   * @returns array of author objects with id and name
   */
  getUniqueAuthors(): {id: string, name: string}[] {
    const uniqueAuthors = new Map<string, string>();
    
    // add each author only once (based on the ID)
    this.comments.forEach(comment => {
      if (comment.authorId && comment.authorName) {
        uniqueAuthors.set(comment.authorId, comment.authorName);
      }
    });
    
    // convert the map to an array of objects
    return Array.from(uniqueAuthors.entries()).map(([id, name]) => ({
      id,
      name
    }));
  }
  
  /**
   * checks the permissions of the current user
   */
  checkPermissions(): void {
    const currentUser = this.authService.currentUserValue;
    
    if (currentUser) {
      const userRole = currentUser.role.toLowerCase();
      this.isAdmin = userRole === UserRole.ADMIN.toLowerCase() || 
                     userRole === UserRole.COMPETENCE_LEADER.toLowerCase();
      this.canAddComments = this.isAdmin;
    } else {
      this.canAddComments = false;
      this.isAdmin = false;
    }
  }
  
  /**
   * checks if the current user is viewing their own profile
   */
  isOwnProfile(): boolean {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return false;
    
    return currentUser.id === this.userId;
  }
  
  /**
   * adds a new comment
   */
  addComment(): void {
    if (!this.newComment.trim()) {
      return;
    }
    
    this.isLoading = true;
    
    // check if user is logged in
    const currentUser = this.authService.currentUserValue;
    if (!currentUser || !currentUser.token) {
      console.error('Benutzer ist nicht angemeldet');
      this.dialogService.showError(
        'Fehler',
        'Sie müssen angemeldet sein, um Kommentare hinzuzufügen.'
      );
      this.isLoading = false;
      return;
    }
    
    this.commentService.addCommentToUser(this.userId, this.newComment).subscribe({
      next: (comment) => {
        if (comment && (comment.id || comment._id)) {
          // load the full user data for the author
          this.userService.getUserById(currentUser.id).subscribe({
            next: (fullUserData) => {
              const authorName = this.createFormalName(fullUserData);
              
              const newComment: Comment = {
                id: comment.id || comment._id || '',
                userId: this.userId,
                authorId: comment.author?._id || currentUser.id,
                authorName: authorName,
                text: comment.content || this.newComment,
                createdAt: new Date(comment.time_stamp) || new Date()
              };
              
              this.comments.unshift(newComment);
              this.newComment = '';
              
              this.dialogService.showSuccess({
                title: 'Erfolg',
                message: 'Kommentar wurde erfolgreich hinzugefügt.',
                buttonText: 'OK'
              });
              this.isLoading = false;
            },
            error: (error) => {
              console.error('Fehler beim Laden der Benutzerdaten:', error);
              // fallback to the username
              const newComment: Comment = {
                id: comment.id || comment._id || '',
                userId: this.userId,
                authorId: comment.author?._id || currentUser.id,
                authorName: currentUser.username || 'Unbekannter Benutzer',
                text: comment.content || this.newComment,
                createdAt: new Date(comment.time_stamp) || new Date()
              };
              
              this.comments.unshift(newComment);
              this.newComment = '';
              this.isLoading = false;
            }
          });
        }
      },
      error: (error) => {
        console.error('Error adding comment:', error);
        this.dialogService.showError(
          'Fehler',
          'Der Kommentar konnte nicht hinzugefügt werden. Bitte versuchen Sie es später erneut.'
        );
        this.isLoading = false;
      }
    });
  }
  
  /**
   * creates a formal name from title (if available), first name and last name
   */
  private createFormalName(user: any): string {
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
    return parts.length > 0 ? parts.join(' ') : user.username || 'Unbekannter Benutzer';
  }
  
  /**
   * filters comments based on the filter criteria
   */
  filterComments(): Comment[] {
    return this.comments.filter(comment => {
      // filter by text
      if (this.commentSearchTerm && 
          !comment.text.toLowerCase().includes(this.commentSearchTerm.toLowerCase())) {
        return false;
      }
      
      // filter by author
      if (this.selectedAuthor && comment.authorId !== this.selectedAuthor) {
        return false;
      }
      
      // filter by date (from)
      if (this.dateFrom) {
        const fromDate = new Date(this.dateFrom);
        if (comment.createdAt < fromDate) {
          return false;
        }
      }
      
      // filter by date (to)
      if (this.dateTo) {
        const toDate = new Date(this.dateTo);
        toDate.setHours(23, 59, 59, 999); // end of the day
        if (comment.createdAt > toDate) {
          return false;
        }
      }
      
      return true;
    });
  }
  
  /**
   * navigates to the edit page of the user
   */
  editUser(): void {
    console.log('Navigiere zur Bearbeitungsseite für Benutzer:', this.userId);
    this.router.navigate(['/users', this.userId, 'edit']);
  }
  
  /**
   * formats the date for display
   */
  formatDate(date: Date): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  
  /**
   * returns the initials of the user (for the avatar)
   */
  getUserInitials(): string {
    console.log('Generating initials for user:', this.user);
    
    if (!this.user) {
      console.log('No user object available');
      return '';
    }
    
    if (!this.user.firstName || !this.user.lastName) {
      console.log('Missing firstName or lastName:', {
        firstName: this.user.firstName,
        lastName: this.user.lastName
      });
      return '';
    }
    
    const initials = (this.user.firstName.charAt(0) + this.user.lastName.charAt(0)).toUpperCase();
    console.log('Generated initials:', initials);
    return initials;
  }
  
  /**
   * returns the formatted name of the user
   */
  getUserFullName(): string {
    if (!this.user) return '';
    return `${this.user.title ? this.user.title + ' ' : ''}${this.user.firstName} ${this.user.lastName}`;
  }
  
  /**
   * returns the formatted employment type
   */
  getEmploymentType(): string {
    if (!this.user) return '';
    return this.user.employmentType === 'Internal' ? 'Intern' : 'Extern';
  }
  
  /**
   * returns the german role name
   * @returns The german role name
   */
  getFormattedRole(): string {
    if (!this.user || !this.user.role) return '';
    
    switch (this.user.role) {
      case UserRole.ADMIN:
        return 'AdministratorIn';
      case UserRole.COMPETENCE_LEADER:
        return 'KompetenzleiterIn';
      case UserRole.LECTURER:
        return 'LektorIn';
      default:
        return this.user.role;
    }
  }
  
  /**
   * returns the name of a skill, regardless of the format
   * @param skill the skill object
   * @returns the name of the skill
   */
  getSkillName(skill: any): string {
    if (!skill) return 'Unbekannte Fähigkeit';
    if (typeof skill === 'string') return skill;
    if (skill.name) return skill.name;
    if (skill._id) return `Fähigkeit (ID: ${skill._id.substring(0, 5)}...)`;
    return 'Unbekannte Fähigkeit';
  }
  
  /**
   * Returns the name of an author by its ID
   * @param authorId The ID of the author
   * @returns The name of the author or "All authors", if no ID is given
   */
  getAuthorNameById(authorId: string): string {
    if (!authorId) return 'Alle Autoren';
    
    const author = this.getUniqueAuthors().find(a => a.id === authorId);
    return author ? author.name : 'Unbekannter Autor';
  }
  
  /**
   * Sets the selected author
   * @param authorId The ID of the selected author or an empty string for "All authors"
   */
  selectAuthor(authorId: string): void {
    this.selectedAuthor = authorId;
    this.isAuthorDropdownOpen = false;
  }
  
  /**
   * Opens or closes the author dropdown
   */
  toggleAuthorDropdown(): void {
    this.isAuthorDropdownOpen = !this.isAuthorDropdownOpen;
  }
  
  /**
   * navigates back to the user list
   */
  goBack(): void {
    this.router.navigate(['/user']);
  }
  
  /**
   * sets the comment to reply to
   * @param comment the comment to reply to
   */
  replyToComment(comment: Comment): void {
    this.replyingToComment = comment;
    this.replyText = '';
  }
  
  /**
   * cancels the reply to a comment
   */
  cancelReply(): void {
    this.replyingToComment = null;
    this.replyText = '';
  }
  
  /**
   * adds a reply to a comment
   */
  addReply(): void {
    if (!this.replyingToComment || !this.replyText.trim()) {
      return;
    }
    
    this.isLoading = true;
    
    // check if user is logged in
    const currentUser = this.authService.currentUserValue;
    if (!currentUser || !currentUser.token) {
      console.error('Benutzer ist nicht angemeldet');
      this.dialogService.showError(
        'Fehler',
        'Sie müssen angemeldet sein, um auf Kommentare zu antworten.'
      );
      this.isLoading = false;
      return;
    }
    
    // add reply to comment
    this.commentService.addReplyToComment(
      this.userId, 
      this.replyingToComment.id || this.replyingToComment._id || '', 
      this.replyText
    ).subscribe({
      next: (reply: any) => {
        if (reply && (reply.id || reply._id)) {
          // Lade die vollständigen Benutzerdaten für den Autor
          this.userService.getUserById(currentUser.id).subscribe({
            next: (fullUserData) => {
              const authorName = this.createFormalName(fullUserData);
              
              // create new reply
              const newReply: Comment = {
                id: reply.id || reply._id || '',
                userId: this.userId,
                authorId: reply.author?._id || currentUser.id,
                authorName: authorName,
                text: reply.content || this.replyText,
                createdAt: new Date(reply.time_stamp) || new Date(),
                parentId: this.replyingToComment?.id || this.replyingToComment?._id || ''
              };
              
              // add reply to comment
              if (this.replyingToComment && !this.replyingToComment.replies) {
                this.replyingToComment.replies = [];
              }
              
              if (this.replyingToComment && this.replyingToComment.replies) {
                this.replyingToComment.replies.push(newReply);
              }
              
              // clear input field and end reply mode
              this.replyText = '';
              this.replyingToComment = null;
              
              this.dialogService.showSuccess({
                title: 'Erfolg',
                message: 'Antwort wurde erfolgreich hinzugefügt.',
                buttonText: 'OK'
              });
              this.isLoading = false;
            },
            error: (error) => {
              console.error('Fehler beim Laden der Benutzerdaten:', error);
              // Fallback to the username
              const newReply: Comment = {
                id: reply.id || reply._id || '',
                userId: this.userId,
                authorId: reply.author?._id || currentUser.id,
                authorName: currentUser.username || 'Unbekannter Benutzer',
                text: reply.content || this.replyText,
                createdAt: new Date(reply.time_stamp) || new Date(),
                parentId: this.replyingToComment?.id || this.replyingToComment?._id || ''
              };
              
              if (this.replyingToComment && !this.replyingToComment.replies) {
                this.replyingToComment.replies = [];
              }
              
              if (this.replyingToComment && this.replyingToComment.replies) {
                this.replyingToComment.replies.push(newReply);
              }
              
              this.replyText = '';
              this.replyingToComment = null;
              this.isLoading = false;
            }
          });
        }
      },
      error: (error) => {
        console.error('Fehler beim Hinzufügen der Antwort:', error);
        this.dialogService.showError(
          'Fehler',
          'Die Antwort konnte nicht hinzugefügt werden. Bitte versuchen Sie es später erneut.'
        );
        this.isLoading = false;
      }
    });
  }
  
  /**
   * checks if a text is too long and should be truncated
   * @param text the text to check
   * @returns true, if the text is longer than maxTextLength
   */
  isTextTooLong(text: string | undefined): boolean {
    return !!text && text.length > this.maxTextLength;
  }
  
  /**
   * returns a truncated text if it is too long
   * @param text the text to truncate
   * @param isExpanded whether the text is already expanded
   * @returns the truncated text or the full text if it is expanded
   */
  getDisplayText(text: string | undefined, isExpanded: boolean): string {
    if (!text) return '';
    if (isExpanded || text.length <= this.maxTextLength) return text;
    return text.substring(0, this.maxTextLength) + '...';
  }
  
  /**
   * toggles the expansion status of a comment
   * @param commentId the ID of the comment
   */
  toggleCommentExpansion(commentId: string | undefined): void {
    if (!commentId) return;
    
    if (this.expandedComments.has(commentId)) {
      this.expandedComments.delete(commentId);
    } else {
      this.expandedComments.add(commentId);
    }
  }
  
  /**
   * toggles the expansion status of a reply
   * @param replyId the ID of the reply
   */
  toggleReplyExpansion(replyId: string | undefined): void {
    if (!replyId) return;
    
    if (this.expandedReplies.has(replyId)) {
      this.expandedReplies.delete(replyId);
    } else {
      this.expandedReplies.add(replyId);
    }
  }
  
  /**
   * checks if a comment is expanded
   * @param commentId the ID of the comment
   * @returns true, if the comment is expanded
   */
  isCommentExpanded(commentId: string | undefined): boolean {
    return !!commentId && this.expandedComments.has(commentId);
  }
  
  /**
   * checks if a reply is expanded
   * @param replyId the ID of the reply
   * @returns true, if the reply is expanded
   */
  isReplyExpanded(replyId: string | undefined): boolean {
    return !!replyId && this.expandedReplies.has(replyId);
  }
  
  /**
   * returns the current user role for debugging purposes
   */
  getCurrentUserRole(): string {
    const currentUser = this.authService.currentUserValue;
    return currentUser?.role || 'keine Rolle';
  }
  
  /**
   * returns the full URL for a profile image
   * @param profileImageUrl the relative URL of the profile image
   * @returns the full URL of the profile image
   */
  getProfileImageUrl(profileImageUrl: string): string {
    if (!profileImageUrl) return '';
    
    // if the URL is already absolute (starts with http or https), use it directly
    if (profileImageUrl.startsWith('http')) {
      return profileImageUrl;
    }
    
    // if the URL starts with a slash, remove it
    const cleanUrl = profileImageUrl.startsWith('/') ? profileImageUrl.substring(1) : profileImageUrl;
    
    // create the full URL
    // use the base URL without the API path
    const baseUrl = environment.apiUrl.split('/api/v1')[0];
    
    // use a direct URL to the backend server
    const fullUrl = `${baseUrl}/${cleanUrl}`;
    console.log('Profilbild-URL:', fullUrl);
    
    // use a static URL without timestamp to avoid Angular errors
    return fullUrl;
  }
  
  /**
   * Handles errors when loading the profile image
   */
  handleImageError(): void {
    console.log('Fehler beim Laden des Profilbilds');
    this.showInitialsOnError = true;
    
    // if the user is available, set the profile image URL to undefined
    if (this.user) {
      this.user = {
        ...this.user,
        profileImageUrl: undefined
      };
    }
  }
}

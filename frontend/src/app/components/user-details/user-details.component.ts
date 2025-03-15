import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user/user.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { DialogService } from '../../core/services/dialog';
import { CommentService } from '../../core/services/comment/comment.service';
import { User, Comment } from '../../models/user.model';

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
  
  // for comments
  newComment: string = '';
  comments: Comment[] = [];
  
  // for filtering comments
  commentSearchTerm: string = '';
  selectedAuthor: string = '';
  dateFrom: string = '';
  dateTo: string = '';
  
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
        this.normalizeSkills();
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
   * normalizes skills data to ensure they are in the correct format
   */
  private normalizeSkills(): void {
    if (!this.user || !this.user.skills) {
      return;
    }
    
    // ensure skills is an array
    if (!Array.isArray(this.user.skills)) {
      this.user.skills = [];
      return;
    }
    
    // filter out invalid skills and keep only valid skills with name property
    this.user.skills = this.user.skills.filter(skill => 
      skill !== null && 
      skill !== undefined && 
      typeof skill === 'object' && 
      (skill.name || typeof skill._id === 'string')
    );
    
    // Entferne alle Referenzen auf Skills, die nicht mehr existieren
    // oder die keine gültigen Namen haben
    this.user.skills = this.user.skills.map(skill => {
      if (skill.name) {
        return skill;
      } else if (typeof skill === 'object' && skill._id) {
        // Wenn nur die ID vorhanden ist, erstellen wir ein einfaches Objekt mit der ID
        // aber ohne Dummy-Namen
        return {
          _id: skill._id,
          name: 'Unbekannte Fähigkeit'
        };
      }
      return null;
    }).filter(skill => skill !== null);
  }
  
  /**
   * loads comments for the user
   */
  loadComments(): void {
    this.isLoading = true;
    
    this.commentService.getCommentsForUser(this.userId).subscribe({
      next: (comments) => {
        // convert comments to the correct format
        this.comments = comments.map(comment => {
          const author = comment.author || { username: 'Unbekannt' };
          return {
            id: comment.id || comment._id || '',
            userId: this.userId,
            authorId: author._id || author.id || '',
            authorName: author.username,
            text: comment.content || '',
            createdAt: new Date(comment.time_stamp || new Date())
          };
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading comments:', error);
        // show empty comment list
        this.comments = [];
        this.isLoading = false;
      }
    });
  }
  
  /**
   * checks the permissions of the current user
   */
  checkPermissions(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      // For development: allow all users to add comments
      this.canAddComments = true;
      this.isAdmin = currentUser.role === 'admin';
    } else {
      this.canAddComments = false;
      this.isAdmin = false;
    }
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
    
    // save username for local display
    const username = currentUser.username || 'Aktueller Benutzer';
    
    this.commentService.addCommentToUser(this.userId, this.newComment).subscribe({
      next: (comment) => {
        // only if we receive a valid response from the server
        if (comment && (comment.id || comment._id)) {
          // add new comment to the list
          const newComment: Comment = {
            id: comment.id || comment._id || '',
            userId: this.userId,
            authorId: comment.author?._id || currentUser.id,
            authorName: comment.author?.username || username,
            text: comment.content || this.newComment,
            createdAt: new Date(comment.time_stamp) || new Date()
          };
          
          // add new comment to the list
          this.comments.unshift(newComment);
          
          // clear input field
          this.newComment = '';
          
          // show success message
          this.dialogService.showSuccess({
            title: 'Erfolg',
            message: 'Kommentar wurde erfolgreich hinzugefügt.',
            buttonText: 'OK'
          });
        } else {
          // if the response is invalid, show an error message
          console.error('Invalid response from server:', comment);
          this.dialogService.showError(
            'Fehler',
            'Der Kommentar konnte nicht hinzugefügt werden. Ungültige Serverantwort.'
          );
        }
        
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error adding comment:', error);
        
        // show an error message
        this.dialogService.showError(
          'Fehler',
          'Der Kommentar konnte nicht hinzugefügt werden. Bitte versuchen Sie es später erneut.'
        );
        
        this.isLoading = false;
      }
    });
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
   * returns the initials of the user (for avatar)
   */
  getUserInitials(): string {
    if (!this.user) return '';
    return (this.user.firstName.charAt(0) + this.user.lastName.charAt(0)).toUpperCase();
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
   * navigates back to the user list
   */
  goBack(): void {
    this.router.navigate(['/user']);
  }
}

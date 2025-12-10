import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UserService } from '../../core/services/user/user.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { EmailService } from '../../core/services/email/email.service';
import { User } from '../../models/user.model';
import { UserRole } from '../../models/enums/user-roles.enum';
import { TranslateModule } from '@ngx-translate/core';
import { UserStatisticsComponent } from '../user-statistics/user-statistics.component';
import { UserDetailsHeaderComponent } from '../user-details-header/user-details-header.component';
import { UserSkillsDisplayComponent } from '../user-skills-display/user-skills-display.component';
import { UserCommentsSectionComponent } from '../user-comments-section/user-comments-section.component';

@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    UserStatisticsComponent,
    UserDetailsHeaderComponent,
    UserSkillsDisplayComponent,
    UserCommentsSectionComponent
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

  // permissions
  canAddComments: boolean = false;
  isAdmin: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private authService: AuthService,
    private emailService: EmailService,
    private cdr: ChangeDetectorRef
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
        this.user.skills = (this.user.skills || []).map(entry => ({
          ...entry,
          skill: { ...entry.skill, level: (entry as any).level }
        }));
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading user details:', error);
        this.error = 'Fehler beim Laden der Benutzerdaten.';
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
   * navigates to the edit page of the user
   */
  editUser(): void {
    console.log('Navigiere zur Bearbeitungsseite für Benutzer:', this.userId);
    this.router.navigate(['/users', this.userId, 'edit']);
  }

  /**
   * navigates back to the user list
   */
  goBack(): void {
    this.router.navigate(['/user']);
  }

  /**
   * Sends an email to the user
   */
  sendEmail(): void {
    if (!this.user) {
      return;
    }

    this.emailService.showEmailDialogToUser(this.user).subscribe();
  }

  /**
   * Handles image error event from header component
   */
  onImageError(): void {
    this.showInitialsOnError = true;
    if (this.user) {
      this.user = {
        ...this.user,
        profileImageUrl: undefined
      };
    }
  }
}

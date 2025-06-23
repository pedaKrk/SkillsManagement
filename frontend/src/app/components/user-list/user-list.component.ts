import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user/user.service';
import { PdfService } from '../../core/services/pdf/pdf.service';
import { EmailService } from '../../core/services/email/email.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { DialogService } from '../../core/services/dialog';
import { User } from '../../models/user.model';
import { Skill } from '../../models/skill.model';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';
import { UserRole } from '../../models/enums/user-roles.enum';
import { NotificationService } from '../../core/services/notification/notification.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss'
})
export class UserListComponent implements OnInit, OnDestroy {
  users: User[] = [];
  filteredUsers: User[] = [];
  isLoading = false;
  error: string | null = null;
  
  // for sorting
  sortField: string = 'username';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // for filtering
  searchTerm: string = '';
  selectedEmploymentType: string = '';
  selectedRole: string = '';
  selectedSkill: string = '';
  selectedSkills: string[] = [];
  
  // for multiple selection
  selectedUsers: string[] = [];
  
  // for skill filtering dropdown
  isSkillDropdownOpen: boolean = false;
  skillSearchTerm: string = '';
  filteredSkillsList: string[] = [];
  allSkills: string[] = [];
  
  // for user actions dropdown
  isUserActionsOpen: boolean = false;
  selectedUserId: string | null = null;
  
  // for email dialog
  showEmailDialog: boolean = false;
  emailSubject: string = 'Nachricht vom Skills Management System';
  emailMessage: string = 'Hallo,\n\nDies ist eine Nachricht vom Skills Management System.\n\nMit freundlichen Grüßen,\nIhr Skills Management Team';
  isSendingEmail: boolean = false;
  
  // for delete dialog
  showDeleteDialog: boolean = false;
  userToDelete: User | null = null;
  
  // for success dialog
  showSuccessDialog: boolean = false;
  successDialogTitle: string = '';
  successDialogMessage: string = '';
  
  // for permission control
  isAdmin: boolean = false;
  isCompetenceLeader: boolean = false;
  currentUserId: string = '';
  
  constructor(
    private userService: UserService,
    private pdfService: PdfService,
    private emailService: EmailService,
    private authService: AuthService,
    private dialogService: DialogService,
    private router: Router,
    private notificationService: NotificationService
  ) {}
  
  ngOnInit(): void {
    // Get current user info
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.currentUserId = currentUser.id;
      
      // Debug: Log the actual role value
      console.log('Raw user role:', currentUser.role);
      
      // Convert role to uppercase and handle both formats (with and without underscore)
      const normalizedRole = currentUser.role?.toUpperCase().replace('_', '');
      console.log('Normalized role:', normalizedRole);
      
      this.isAdmin = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.COMPETENCE_LEADER;
      this.isCompetenceLeader = currentUser.role === UserRole.COMPETENCE_LEADER;
      
      console.log('Permissions after check:', {
        isAdmin: this.isAdmin,
        isCompetenceLeader: this.isCompetenceLeader,
        currentUserId: this.currentUserId,
        normalizedRole
      });
    }
    
    this.loadUsers();
    console.log('UserListComponent initialized');
    
    // click outside of skill dropdown to close it
    document.addEventListener('click', this.closeSkillDropdownOnOutsideClick.bind(this));
  }
  
  ngOnDestroy(): void {
    // remove click event listener
    document.removeEventListener('click', this.closeSkillDropdownOnOutsideClick.bind(this));
  }
  
  // helper function to close the dropdown on click outside
  closeSkillDropdownOnOutsideClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-wrapper') && this.isSkillDropdownOpen) {
      this.isSkillDropdownOpen = false;
    }
  }
  
  loadUsers(): void {
    this.isLoading = true;
    this.error = null;
    
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        // map users to have an id
        this.users = users.map(user => {
          // if no id but _id exists, use _id as id
          if (!user.id && (user as any)._id) {
            return { ...user, id: (user as any)._id };
          }
          // if no id but _id exists, generate a temporary id
          if (!user.id) {
            return { ...user, id: 'temp-' + Math.random().toString(36).substr(2, 9) };
          }
          return user;
        });
        
        console.log('Users loaded:', this.users.length);
        
        // Debug: Check the user IDs
        this.users.forEach((user, index) => {
          console.log(`User ${index}:`, user.username, 'ID:', user.id);
        });
        
        this.filteredUsers = [...this.users];
        
        // Load all available skills
        this.loadAllSkills();
        
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.isLoading = false;
        
        // Only show the specific message if it's a permission error
        if (error.status === 403) {
          this.error = 'Sie haben keine Berechtigung, die Benutzerliste anzuzeigen.';
        } else if (error.status === 401) {
          this.error = 'Bitte melden Sie sich an, um die Benutzerliste anzuzeigen.';
        } else {
          this.error = 'Fehler beim Laden der Benutzer. Bitte versuchen Sie es später erneut.';
        }
      }
    });
  }
  
  // sorting
  sortUsers(field: string): void {
    if (this.sortField === field) {
      // if the same field is clicked again, reverse the sort direction
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // new field, sort ascending by default
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    
    this.applyFilters();
  }
  
  // filtering
  applyFilters(): void {
    let filtered = [...this.users];
    
    // search over multiple fields
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.username.toLowerCase().includes(term) ||
        user.firstName.toLowerCase().includes(term) ||
        user.lastName.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        (user.title && user.title.toLowerCase().includes(term)) ||
        (user.phoneNumber && user.phoneNumber.toLowerCase().includes(term))
      );
    }
    
    // filtering by employment type
    if (this.selectedEmploymentType) {
      filtered = filtered.filter(user => 
        user.employmentType === this.selectedEmploymentType
      );
    }
    
    // filtering by role
    if (this.selectedRole) {
      filtered = filtered.filter(user => 
        user.role === this.selectedRole
      );
    }
    
    // filtering by skills (multiple skills)
    if (this.selectedSkills.length > 0) {
      filtered = filtered.filter(user => {
        if (!user.skills || user.skills.length === 0) {
          return false;
        }
        
        // check if the user has at least one of the selected skills
        return this.selectedSkills.some(selectedSkill => {
          return user.skills!.some(skill => {
            const skillName = this.getSkillName(skill);
            return skillName.toLowerCase() === selectedSkill.toLowerCase();
          });
        });
      });
    }
    
    // sorting
    filtered.sort((a, b) => {
      let valueA: any = a[this.sortField as keyof User];
      let valueB: any = b[this.sortField as keyof User];
      
      // handling null values
      if (valueA === null || valueA === undefined) valueA = '';
      if (valueB === null || valueB === undefined) valueB = '';
      
      // comparing strings
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        if (this.sortDirection === 'asc') {
          return valueA.localeCompare(valueB);
        } else {
          return valueB.localeCompare(valueA);
        }
      }
      
      // comparing numbers
      if (this.sortDirection === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });
    
    this.filteredUsers = filtered;
  }
  
  // user selection
  toggleUserSelection(userId: string, event?: Event): void {
    // always stop the event to prevent propagation
    if (event) {
      event.stopPropagation();
    }
    
    console.log('Toggle for user with ID:', userId);
    console.log('Current selection before toggle:', [...this.selectedUsers]);
    
    // check if the user is already selected
    const index = this.selectedUsers.indexOf(userId);
    
    // toggle logic for this one user
    if (index === -1) {
      // user is not selected, so add him
      this.selectedUsers.push(userId);
      console.log('User added:', userId);
    } else {
      // user is already selected, so remove him
      this.selectedUsers.splice(index, 1);
      console.log('User removed:', userId);
    }
    
    console.log('Selected users after toggle:', [...this.selectedUsers]);
    
    // Debug: Check if the checkbox states are correct
    setTimeout(() => {
      this.filteredUsers.forEach(user => {
        const isSelected = this.isUserSelected(user.id);
        const checkbox = document.getElementById('user-checkbox-' + user.id) as HTMLInputElement;
        if (checkbox) {
          console.log(`Checkbox for ${user.username} (ID: ${user.id}): checked=${checkbox.checked}, isSelected=${isSelected}`);
        }
      });
    }, 0);
  }
  
  selectAllUsers(): void {
    // if all are selected, empty the selection
    if (this.selectedUsers.length === this.filteredUsers.length) {
      this.selectedUsers = [];
    } else {
      // otherwise select all
      this.selectedUsers = this.filteredUsers.map(user => user.id).filter(Boolean);
    }
    
    console.log('All users selected:', this.selectedUsers);
  }
  
  // helper method to check if a user is selected
  isUserSelected(userId: string): boolean {
    return this.selectedUsers.includes(userId);
  }
  
  // generate PDF
  generatePDF(): void {
    console.log('Generating PDF for selected users:', this.selectedUsers);
    
    // filter the selected users
    const selectedUserData = this.filteredUsers.filter(user => 
      this.selectedUsers.includes(user.id)
    );
    
    // call the PDF service to generate the PDF
    this.pdfService.generateUserListPDF(selectedUserData)
      .then(() => {
        console.log('PDF was successfully generated');
      })
      .catch(error => {
        console.error('Error generating PDF:', error);
      });
  }
  
  // send email
  sendEmail(): void {
    console.log('Opening email dialog for selected users:', this.selectedUsers);
    
    if (this.selectedUsers.length === 0) {
      this.dialogService.showError('Error', 'Please select at least one user.');
      return;
    }
    
    // Use the Dialog-Service for the email form
    const selectedUsers = this.getSelectedUsers();
    
    this.dialogService.showFormDialog({
      title: 'E-Mail an ausgewählte Benutzer senden',
      message: `Sie senden eine E-Mail an ${selectedUsers.length} Benutzer.`,
      formFields: [
        {
          id: 'recipients',
          label: 'Empfänger',
          type: 'textarea',
          defaultValue: selectedUsers.map((user: User) => `${user.firstName} ${user.lastName} (${user.email})`).join('\n'),
          required: true,
          disabled: true,
          rows: Math.min(selectedUsers.length, 4)
        },
        {
          id: 'subject',
          label: 'Betreff',
          type: 'text',
          defaultValue: this.emailSubject,
          required: true,
          placeholder: 'Betreff eingeben...'
        },
        {
          id: 'message',
          label: 'Nachricht',
          type: 'textarea',
          defaultValue: this.emailMessage,
          required: true,
          placeholder: 'Nachricht eingeben...',
          rows: 6
        }
      ],
      submitText: 'E-Mail senden',
      cancelText: 'Abbrechen'
    }).subscribe(formData => {
      if (formData) {
        
        this.emailSubject = formData.subject;
        this.emailMessage = formData.message;
        
        // send email to users
        this.sendEmailToUsers(selectedUsers, formData.subject, formData.message);
      }
    });
  }
  
  /**
   * Returns the selected users
   */
  getSelectedUsers(): User[] {
    return this.filteredUsers.filter(user => 
      this.selectedUsers.includes(user.id)
    );
  }
  
  /**
   * sends an email to the selected users
   */
  sendEmailToUsers(users: User[], subject: string, message: string): void {
    // show loading animation
    this.isLoading = true;
    
    // send email directly from the system
    this.emailService.sendEmailToUsers(users, subject, message)
      .subscribe({
        next: (response) => {
          console.log('Email sent successfully', response);
          this.isLoading = false;
          
          // show success message with the dialog service
          this.dialogService.showSuccess({
            title: 'Erfolg',
            message: 'Die E-Mail wurde erfolgreich gesendet!',
            buttonText: 'OK'
          });
        },
        error: (error) => {
          console.error('Error sending email', error);
          this.isLoading = false;
          
          let errorMessage = 'Fehler beim Senden der E-Mail. ';
          
          if (error.status === 401) {
            errorMessage += 'Sie sind nicht autorisiert. Bitte melden Sie sich erneut an.';
            // Log out user and redirect to login page
            this.authService.logout();
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 1500);
          } else if (error.status === 400) {
            errorMessage += 'Ungültige Eingabe. Bitte überprüfen Sie die E-Mail-Adressen.';
          } else {
            errorMessage += 'Bitte versuchen Sie es später erneut.';
          }
          
          // show error message with the dialog service
          this.dialogService.showError('Fehler', errorMessage);
        }
      });
  }
  
  // reset filters
  resetFilters(): void {
    this.searchTerm = '';
    this.selectedEmploymentType = '';
    this.selectedRole = '';
    this.selectedSkill = '';
    this.selectedSkills = [];
    this.applyFilters();
  }
  
  // edit user
  editUser(userId: string): void {
    console.log('edit user:', userId);
    console.log('Current permissions:', {
      isAdmin: this.isAdmin,
      isCompetenceLeader: this.isCompetenceLeader,
      currentUserId: this.currentUserId
    });
    
    // Check if the user has permission to edit
    const isOwnProfile = userId === this.currentUserId;
    const hasManagementPermission = this.isAdmin || this.isCompetenceLeader;
    
    // If neither Admin nor Competence Leader and not own profile
    if (!hasManagementPermission && !isOwnProfile) {
      this.dialogService.showError(
        'Keine Berechtigung', 
        'Als Dozent können Sie nur Ihre eigenen Skills verwalten.'
      );
      return;
    }
    
    // Navigate to skills management
    this.router.navigate(['/users', userId, 'skills']);
  }
  
  // update user
  updateUser(userId: string, userData: Partial<User>): void {
    this.userService.updateUser(userId, userData).subscribe({
      next: (updatedUser) => {
        console.log('User updated:', updatedUser);
        
        // update user in the list
        const index = this.users.findIndex(u => u.id === userId);
        if (index !== -1) {
          this.users[index] = { ...this.users[index], ...userData };
        }
        
        // apply filters to update the list
        this.applyFilters();
        
        // show success message
        this.showSuccessMessage(
          'Benutzer aktualisiert',
          `Die Informationen für ${userData.firstName} ${userData.lastName} wurden erfolgreich aktualisiert.`,
          true
        );
      },
      error: (error) => {
        console.error('Error updating user:', error);
        
        // show error message
        this.showSuccessMessage(
          'Fehler',
          'Beim Aktualisieren des Benutzers ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.',
          false
        );
      }
    });
  }
  
  // view user details
  viewUserDetails(userId: string): void {
    console.log('view user details:', userId);
    
    // navigate to user details page
    this.router.navigate(['/users', userId]);
  }
  
  // delete user
  deleteUser(userId: string): void {
    console.log('delete user:', userId);
    
    // Check if the user has Admin rights
    if (!this.isAdmin) {
      this.dialogService.showError(
        'Keine Berechtigung', 
        'Sie haben keine Berechtigung, Benutzer zu löschen. Diese Aktion ist nur für Administratoren verfügbar.'
      );
      return;
    }
    
    // Find the user to delete
    const user = this.filteredUsers.find(u => u.id === userId);
    if (!user) {
      console.error('User not found:', userId);
      return;
    }
    
    this.dialogService.showConfirmation({
      title: 'Benutzer löschen',
      message: `
        <div style="font-size: 1.2rem; margin-bottom: 1.5rem;">
          Sind Sie sicher, dass Sie diesen Benutzer löschen möchten?
        </div>
        <div style="background-color: #f8f9fa; padding: 1rem; border-radius: 8px; border-left: 4px solid #0077a9; margin-bottom: 1rem;">
          <div style="margin-bottom: 0.5rem;"><strong>Name:</strong> ${user.firstName} ${user.lastName}</div>
          <div style="margin-bottom: 0.5rem;"><strong>Benutzername:</strong> ${user.username}</div>
          <div><strong>E-Mail:</strong> ${user.email}</div>
        </div>
        <div style="color: #dc3545; font-weight: 500; margin-top: 1rem;">
          Diese Aktion kann nicht rückgängig gemacht werden!
        </div>
      `,
      confirmText: 'Benutzer löschen',
      cancelText: 'Abbrechen',
      dangerMode: true,
      data: { user }
    }).subscribe(confirmed => {
      if (confirmed) {
        this.confirmDeleteUser(user);
      }
    });
  }
  
  // Confirm delete user
  confirmDeleteUser(user: User): void {
    // Check again if the user has Admin rights (additional security level)
    if (!this.isAdmin) {
      this.dialogService.showError(
        'Keine Berechtigung', 
        'Sie haben keine Berechtigung, Benutzer zu löschen. Diese Aktion ist nur für Administratoren verfügbar.'
      );
      return;
    }
    
    this.isLoading = true;
    
    // Delete the user via the UserService
    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.isLoading = false;
        
        // Remove the user from the list
        this.users = this.users.filter(u => u.id !== user.id);
        this.filteredUsers = this.filteredUsers.filter(u => u.id !== user.id);
        
        // Show successful deletion
        this.dialogService.showSuccess({
          title: 'Benutzer gelöscht',
          message: `Der Benutzer "${user.firstName} ${user.lastName}" wurde erfolgreich gelöscht.`,
          buttonText: 'OK'
        });
      },
      error: (error) => {
        console.error('Error deleting user:', error);
        this.isLoading = false;
        
        let errorMessage = 'Fehler beim Löschen des Benutzers. ';
        
        if (error.status === 401) {
          errorMessage += 'Sie sind nicht autorisiert. Bitte melden Sie sich erneut an.';
          // Log out user and redirect to login page
          this.authService.logout();
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 1500);
        } else if (error.status === 403) {
          errorMessage += 'Sie haben keine Berechtigung, Benutzer zu löschen.';
        } else {
          errorMessage += 'Bitte versuchen Sie es später erneut.';
        }
        
        this.dialogService.showError('Fehler', errorMessage);
      }
    });
  }
  
  /**
   * Shows a success message in a custom dialog
   */
  showSuccessMessage(title: string, message: string, isSuccess: boolean = true): void {
    this.successDialogTitle = title;
    this.successDialogMessage = message;
    this.showSuccessDialog = true;
  }
  
  /**
   * Closes the success dialog
   */
  closeSuccessDialog(): void {
    this.showSuccessDialog = false;
  }
  
  // helper method to get the skill name
  getSkillName(skill: any): string {
    if (!skill) return 'Unbekannte Fähigkeit';
    // if skill is a string (ID), return a generic name
    if (typeof skill === 'string') {
      return 'Unbekannte Fähigkeit';
    }
    // if skill is an object with skill and name
    if (typeof skill === 'object' && skill.skill && skill.skill.name) {
      return skill.skill.name;
    }
    // if skill is an object, but no name attribute
    if (typeof skill === 'object' && skill._id) {
      return 'Unbekannte Fähigkeit';
    }
    // fallback
    return 'Unbekannte Fähigkeit';
  }
  
  // method to filter by skills (multiple)
  filterBySkill(skill: string): void {
    const index = this.selectedSkills.indexOf(skill);
    
    if (index === -1) {
      // skill is not selected, so add it
      this.selectedSkills.push(skill);
    } else {
      // skill is already selected, so remove it
      this.selectedSkills.splice(index, 1);
    }
    
    // for backwards compatibility
    this.selectedSkill = this.selectedSkills.length > 0 ? this.selectedSkills[0] : '';
    
    this.applyFilters();
  }
  
  // method to check if a skill is selected
  isSkillSelected(skill: string): boolean {
    return this.selectedSkills.includes(skill);
  }
  
  /**
   * Checks if active filters are set
   */
  hasActiveFilters(): boolean {
    return this.searchTerm.trim() !== '' || 
           this.selectedEmploymentType !== '' || 
           this.selectedRole !== '' || 
           this.selectedSkills.length > 0;
  }
  
  /**
   * Removes a skill from the selection
   */
  removeSkill(skill: string): void {
    const index = this.selectedSkills.indexOf(skill);
    if (index !== -1) {
      this.selectedSkills.splice(index, 1);
      
      // for backwards compatibility
      this.selectedSkill = this.selectedSkills.length > 0 ? this.selectedSkills[0] : '';
      
      this.applyFilters();
    }
  }
  
  // method to reset all selected skills
  clearAllSkills(): void {
    this.selectedSkills = [];
    this.selectedSkill = '';
    this.applyFilters();
  }
  
  // method to load all skills
  loadAllSkills(): void {
    const skillsSet = new Set<string>();
    
    this.users.forEach(user => {
      if (user.skills && user.skills.length > 0) {
        user.skills.forEach(skill => {
          const skillName = this.getSkillName(skill);
          if (skillName && skillName !== '-') {
            skillsSet.add(skillName);
          }
        });
      }
    });
    
    this.allSkills = Array.from(skillsSet).sort();
    this.filteredSkillsList = [...this.allSkills];
  }
  
  // method to open/close the skill dropdown
  toggleSkillDropdown(): void {
    this.isSkillDropdownOpen = !this.isSkillDropdownOpen;
    
    if (this.isSkillDropdownOpen) {
      // when the dropdown is opened, reset the skill list
      this.skillSearchTerm = '';
      this.filteredSkillsList = [...this.allSkills];
    }
  }
  
  // method to filter the skill list based on the search term
  filterSkillsList(): void {
    if (!this.skillSearchTerm) {
      this.filteredSkillsList = [...this.allSkills];
      return;
    }
    
    const searchTerm = this.skillSearchTerm.toLowerCase();
    this.filteredSkillsList = this.allSkills.filter(skill => 
      skill.toLowerCase().includes(searchTerm)
    );
  }
  
  // method to get all available skills
  getAllSkills(): string[] {
    return this.allSkills;
  }
  
  /**
   * Checks the permissions of the logged in user
   */
  checkUserPermissions(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.currentUserId = currentUser.id;
      
      this.isAdmin = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.COMPETENCE_LEADER;
      this.isCompetenceLeader = currentUser.role === UserRole.COMPETENCE_LEADER;
      
      console.log('User permissions:', { 
        isAdmin: this.isAdmin, 
        isCompetenceLeader: this.isCompetenceLeader,
        currentUserId: this.currentUserId
      });
    }
  }
  
  // Toggle user actions menu
  toggleUserActions(userId: string): void {
    if (this.selectedUserId === userId && this.isUserActionsOpen) {
      // Close menu if the same user is clicked again
      this.isUserActionsOpen = false;
      this.selectedUserId = null;
    } else {
      // Open menu for the clicked user
      this.isUserActionsOpen = true;
      this.selectedUserId = userId;
    }
  }
  
  // Open delete dialog
  openDeleteDialog(user: User): void {
    this.userToDelete = user;
    this.deleteUser(user.id);
  }
  
  // Deactivate user
  deactivateUser(user: User): void {
    if (!this.isAdmin && !this.isCompetenceLeader) {
      this.dialogService.showError(
        'Keine Berechtigung',
        'Sie haben keine Berechtigung, Benutzer zu deaktivieren. Diese Aktion ist nur für Administratoren und Competence Leader verfügbar.'
      );
      return;
    }

    this.dialogService.showConfirmation({
      title: 'Benutzer deaktivieren',
      message: `Möchten Sie den Benutzer "${user.firstName} ${user.lastName}" wirklich deaktivieren?`,
      confirmText: 'Deaktivieren',
      cancelText: 'Abbrechen'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.isLoading = true;
        this.userService.deactivateUser(user.id).subscribe({
          next: () => {
            this.isLoading = false;
            // Remove the user from the list
            this.users = this.users.filter(u => u.id !== user.id);
            this.filteredUsers = this.filteredUsers.filter(u => u.id !== user.id);
            
            // Show success message
            this.dialogService.showSuccess({
              title: 'Benutzer deaktiviert',
              message: `Der Benutzer "${user.firstName} ${user.lastName}" wurde erfolgreich deaktiviert.`,
              buttonText: 'OK'
            });
            
            // Notify about inactive users count change
            this.notificationService.notifyInactiveUsersCountChanged();
          },
          error: (error) => {
            console.error('Error deactivating user:', error);
            this.isLoading = false;
            
            let errorMessage = 'Fehler beim Deaktivieren des Benutzers. ';
            
            if (error.status === 401) {
              errorMessage += 'Sie sind nicht autorisiert. Bitte melden Sie sich erneut an.';
              this.authService.logout();
              setTimeout(() => {
                this.router.navigate(['/login']);
              }, 1500);
            } else if (error.status === 403) {
              errorMessage += 'Sie haben keine Berechtigung, Benutzer zu deaktivieren.';
            } else {
              errorMessage += 'Bitte versuchen Sie es später erneut.';
            }
            
            this.dialogService.showError('Fehler', errorMessage);
          }
        });
      }
    });
  }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user/user.service';
import { PdfService } from '../../core/services/pdf/pdf.service';
import { EmailService } from '../../core/services/email/email.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { User, Skill } from '../../models/user.model';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';

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
  
  // for email dialog
  showEmailDialog: boolean = false;
  emailSubject: string = 'Nachricht vom Skills Management System';
  emailMessage: string = 'Hallo,\n\nDies ist eine Nachricht vom Skills Management System.\n\nMit freundlichen Grüßen,\nIhr Skills Management Team';
  isSendingEmail: boolean = false;
  
  constructor(
    private userService: UserService,
    private pdfService: PdfService,
    private emailService: EmailService,
    private authService: AuthService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
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
        
        // Load all available skills
        this.loadAllSkills();
        
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.error = 'Error loading users. Please try again later.';
        this.isLoading = false;
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
            const skillName = skill.name || this.getSkillName(skill);
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
      alert('Please select at least one user.');
      return;
    }
    
    // Open email dialog
    this.showEmailDialog = true;
  }
  
  /**
   * Closes the email dialog
   */
  closeEmailDialog(): void {
    this.showEmailDialog = false;
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
   * Confirms sending the email
   */
  confirmSendEmail(): void {
    const selectedUserData = this.getSelectedUsers();
    
    if (selectedUserData.length === 0) {
      alert('No users selected');
      return;
    }
    
    // Show loading animation
    this.isSendingEmail = true;
    
    // Send email directly from the system
    this.emailService.sendEmailToUsers(selectedUserData, this.emailSubject, this.emailMessage)
      .subscribe({
        next: (response) => {
          console.log('Email sent successfully', response);
          this.isSendingEmail = false;
          alert('Email was sent successfully!');
          this.closeEmailDialog();
        },
        error: (error) => {
          console.error('Error sending email', error);
          this.isSendingEmail = false;
          
          let errorMessage = 'Error sending email. ';
          
          if (error.status === 401) {
            errorMessage += 'You are not authorized. Please log in again.';
            // Log out user and redirect to login page
            this.authService.logout();
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 1500);
          } else if (error.status === 400) {
            errorMessage += 'Invalid input. Please check the email addresses.';
          } else {
            errorMessage += 'Please try again later.';
          }
          
          alert(errorMessage);
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
    // navigate to edit page
  }
  
  // view user details
  viewUserDetails(userId: string): void {
    console.log('view user details:', userId);
    // navigate to detail page or show details in a modal
  }
  
  // delete user
  deleteUser(userId: string): void {
    if (confirm('Are you sure you want to delete this user?')) {
      console.log('delete user:', userId);
      // here delete logic implement
    }
  }
  
  // helper method to get the skill name
  getSkillName(skill: any): string {
    // if skill is a string (ID), try to find the name from the skill list
    if (typeof skill === 'string') {
    
      return `Skill-ID: ${skill}`;
    }
    
    // if skill is an object, but no name attribute
    if (typeof skill === 'object' && skill._id) {
      return `Skill-ID: ${skill._id}`;
    }
    
    // fallback
    return '-';
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
          const skillName = skill.name || this.getSkillName(skill);
          if (skillName !== '-') {
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
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user/user.service';
import { PdfService } from '../../core/services/pdf/pdf.service';
import { User, Skill } from '../../models/user.model';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

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
export class UserListComponent implements OnInit {
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
  
  // for multiple selection
  selectedUsers: string[] = [];
  
  constructor(
    private userService: UserService,
    private pdfService: PdfService
  ) {}
  
  ngOnInit(): void {
    this.loadUsers();
    console.log('UserListComponent initialisiert');
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
        
        console.log('Benutzer geladen:', this.users.length);
        
        // Debug: Check the user IDs
        this.users.forEach((user, index) => {
          console.log(`User ${index}:`, user.username, 'ID:', user.id);
        });
        
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.error = 'Fehler beim Laden der Benutzer. Bitte versuchen Sie es später erneut.';
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
    
    // filtering after employment type
    if (this.selectedEmploymentType) {
      filtered = filtered.filter(user => 
        user.employmentType === this.selectedEmploymentType
      );
    }
    
    // filtering after role
    if (this.selectedRole) {
      filtered = filtered.filter(user => 
        user.role === this.selectedRole
      );
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
    
    console.log('Toggle für Benutzer mit ID:', userId);
    console.log('Aktuelle Auswahl vor Toggle:', [...this.selectedUsers]);
    
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
    
    console.log('Ausgewählte Benutzer nach Toggle:', [...this.selectedUsers]);
    
    // Debug: Check if the checkbox states are correct
    setTimeout(() => {
      this.filteredUsers.forEach(user => {
        const isSelected = this.isUserSelected(user.id);
        const checkbox = document.getElementById('user-checkbox-' + user.id) as HTMLInputElement;
        if (checkbox) {
          console.log(`Checkbox für ${user.username} (ID: ${user.id}): checked=${checkbox.checked}, isSelected=${isSelected}`);
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
    
    console.log('Alle Benutzer ausgewählt:', this.selectedUsers);
  }
  
  // helper method to check if a user is selected
  isUserSelected(userId: string): boolean {
    return this.selectedUsers.includes(userId);
  }
  
  // generate PDF
  generatePDF(): void {
    console.log('Generiere PDF für ausgewählte Benutzer:', this.selectedUsers);
    
    // filter the selected users
    const selectedUserData = this.filteredUsers.filter(user => 
      this.selectedUsers.includes(user.id)
    );
    
    // call the PDF service to generate the PDF
    this.pdfService.generateUserListPDF(selectedUserData)
      .then(() => {
        console.log('PDF wurde erfolgreich generiert');
      })
      .catch(error => {
        console.error('Fehler bei der PDF-Generierung:', error);
      });
  }
  
  // send email
  sendEmail(): void {
    console.log('send email to selected users:', this.selectedUsers);
    // here email sending logic implement
  }
  
  // reset filters
  resetFilters(): void {
    this.searchTerm = '';
    this.selectedEmploymentType = '';
    this.selectedRole = '';
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
}

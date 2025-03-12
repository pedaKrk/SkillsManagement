import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user/user.service';
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
  
  constructor(private userService: UserService) {}
  
  ngOnInit(): void {
    this.loadUsers();
  }
  
  loadUsers(): void {
    this.isLoading = true;
    this.error = null;
    
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
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
  toggleUserSelection(userId: string): void {
    const index = this.selectedUsers.indexOf(userId);
    if (index === -1) {
      this.selectedUsers.push(userId);
    } else {
      this.selectedUsers.splice(index, 1);
    }
  }
  
  selectAllUsers(): void {
    if (this.selectedUsers.length === this.filteredUsers.length) {
      // if all are selected, deselect all
      this.selectedUsers = [];
    } else {
      // otherwise select all
      this.selectedUsers = this.filteredUsers.map(user => user.id);
    }
  }
  
  // generate PDF
  generatePDF(): void {
    console.log('generate PDF for selected users:', this.selectedUsers);
    // here PDF generation logic implement
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
      // we should actually have a skill list to find the name
      // but we don't have it, so we return the ID
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

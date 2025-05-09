import { Component, OnInit, NgZone, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UserService } from '../../core/services/user/user.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { User, UserSkillEntry } from '../../models/user.model';
import { DialogService } from '../../core/services/dialog/dialog.service';
import { Skill } from '../../models/skill.model';
import { HttpClient } from '@angular/common/http';
import { API_CONFIG } from '../../core/config/api.config';
import { environment } from '../../../environments/environment';
import { SkillLevel } from '../../models/enums/skill-level.enum';

@Component({
  selector: 'app-user-skills-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule
  ],
  templateUrl: './user-skills-management.component.html',
  styleUrl: './user-skills-management.component.scss'
})
export class UserSkillsManagementComponent implements OnInit {
  @Input() userId!: string;
  @Input() isAdmin!: boolean;
  @Input() canEdit!: boolean;
  
  user: User | null = null;
  isLoading: boolean = true;
  error: string | null = null;
  
  // Skills Management
  availableSkills: Skill[] = [];
  selectedSkills: UserSkillEntry[] = [];
  filteredSkills: Skill[] = [];
  isLoadingSkills = false;
  skillsError: string | null = null;
  skillSearchControl = new FormControl('');
  isSkillDropdownOpen = false;
  skillLevels = Object.values(SkillLevel);
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private authService: AuthService,
    private dialogService: DialogService,
    private http: HttpClient,
    private ngZone: NgZone
  ) {}
  
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.userId = params['id'];
      }
      this.loadUserData();
    });
    // Subscribe to search input changes
    this.skillSearchControl.valueChanges.subscribe(searchTerm => {
      if (searchTerm !== null) {
        this.filterSkills(searchTerm);
      }
    });
  }
  
  private loadUserData(): void {
    this.isLoading = true;
    console.log('Loading user data for ID:', this.userId);
    
    this.userService.getUserById(this.userId).subscribe({
      next: (user) => {
        console.log('User data loaded:', user);
        this.user = user;
        this.selectedSkills = (user.skills || [])
          .filter(entry => entry && entry.skill && entry.skill._id && entry.skill.name)
          .map(entry => ({
            ...entry,
            skill: { ...entry.skill, level: entry.skill.level ?? (entry as any).level },
            showLevelDropdown: false
          }));
        this.isLoading = false;
        
        
        // Load available skills after user data is loaded
        if (!this.availableSkills.length) {
          this.loadSkills();
        }
      },
      error: (error) => {
        console.error('Fehler beim Laden der Benutzerdaten:', error);
        this.error = 'Benutzerdaten konnten nicht geladen werden.';
        this.isLoading = false;
      }
    });
  }

  // Load skills from backend
  loadSkills(): void {
    this.isLoadingSkills = true;
    this.skillsError = null;
    
    this.http.get<Skill[]>(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.skills.all}`).subscribe({
      next: (skills) => {
        console.log('Skills loaded successfully:', skills);
        // filter out already assigned skills
        this.availableSkills = this.filterOutAssignedSkills(skills);
        this.filteredSkills = [...this.availableSkills];
        this.isLoadingSkills = false;
      },
      error: (error) => {
        console.error('Error loading skills:', error);
        this.skillsError = 'Skills konnten nicht geladen werden.';
        this.isLoadingSkills = false;
      }
    });
  }

  /**
   * Filter out already assigned skills from the list of available skills
   */
  private filterOutAssignedSkills(allSkills: Skill[]): Skill[] {
    return allSkills.filter(skill =>
      !this.selectedSkills.some(selectedSkill => selectedSkill.skill._id === skill._id)
    );
  }

  // Retry loading skills
  retryLoadSkills(): void {
    this.loadSkills();
  }

  // Filter skills based on search term
  filterSkills(searchTerm: string): void {
    if (!searchTerm.trim()) {
      this.filteredSkills = [...this.availableSkills];
      return;
    }
    const term = searchTerm.toLowerCase().trim();
    this.filteredSkills = this.availableSkills.filter(skill =>
      skill.name.toLowerCase().includes(term)
    );
  }

  // Toggle skill dropdown
  toggleSkillDropdown(): void {
    this.isSkillDropdownOpen = !this.isSkillDropdownOpen;
    console.log('Dropdown toggled:', this.isSkillDropdownOpen);
    
    if (this.isSkillDropdownOpen) {
      setTimeout(() => {
        document.addEventListener('click', this.handleOutsideClick);
      }, 0);
      
      if (this.availableSkills.length === 0 && !this.isLoadingSkills && !this.skillsError) {
        console.log('No skills available, reloading...');
        this.loadSkills();
      }
    } else {
      document.removeEventListener('click', this.handleOutsideClick);
    }
  }

  // Handle clicks outside the dropdown
  private handleOutsideClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const dropdown = document.querySelector('.skills-dropdown-container');
    
    if (dropdown && !dropdown.contains(target)) {
      this.ngZone.run(() => {
        this.isSkillDropdownOpen = false;
        document.removeEventListener('click', this.handleOutsideClick);
      });
    }
  };

  // Toggle skill selection
  toggleSkill(skillId: string): void {
    const skill = this.availableSkills.find(s => s._id === skillId);
    if (!skill) return;
    // UserSkillEntry erzeugen
    const currentUser = this.authService.currentUserValue;
    this.selectedSkills.push({
      skill: skill,
      addedAt: new Date(),
      addedBy: currentUser ? {
        _id: currentUser.id,
        firstName: undefined,
        lastName: undefined,
        email: currentUser.email
      } : undefined,
      showLevelDropdown: false
    });
    // remove the selected skill from the available skills
    this.availableSkills = this.availableSkills.filter(s => s._id !== skillId);
    this.filteredSkills = this.filteredSkills.filter(s => s._id !== skillId);
  }

  // Check if a skill is selected
  isSkillSelected(skillId: string): boolean {
    return this.selectedSkills.some(entry => entry.skill._id === skillId);
  }
  
  saveSkills(): void {
    if (!this.user) return;
    // Format for the backend: Array of objects with skill, level, addedAt, addedBy
    const formattedSkills = this.selectedSkills.map(entry => ({
      skill: entry.skill._id,
      level: entry.skill.level,
      addedAt: entry.addedAt,
      addedBy: entry.addedBy?._id
    }));
    const updatedUser: Partial<User> = {
      ...this.user,
      skills: formattedSkills as any // backend expects this format
    };
    console.log('Saving skills:', formattedSkills);
    this.userService.updateUser(this.userId, updatedUser).subscribe({
      next: () => {
        this.dialogService.showSuccess({
          title: 'Erfolg',
          message: 'Skills wurden erfolgreich aktualisiert.',
          buttonText: 'OK'
        });
        this.router.navigate(['/users', this.userId]);
      },
      error: (error) => {
        console.error('Fehler beim Speichern der Skills:', error);
        this.dialogService.showError('Fehler', 'Skills konnten nicht gespeichert werden.');
      }
    });
  }
  
  cancel(): void {
    this.router.navigate(['/users', this.userId]);
  }

  /**
   * Shows a confirmation dialog and removes the skill after confirmation
   */
  confirmRemoveSkill(skill: Skill): void {
    this.dialogService.showConfirmation({
      title: 'Skill entfernen',
      message: `Möchten Sie den Skill "${skill.name}" wirklich entfernen?`,
      confirmText: 'Ja, entfernen',
      cancelText: 'Abbrechen',
      dangerMode: true
    }).subscribe((confirmed: boolean) => {
      if (confirmed && this.user) {
        // remove the skill locally
        this.selectedSkills = this.selectedSkills.filter(entry => entry.skill._id !== skill._id);
        // add the removed skill back to the available skills
        this.availableSkills.push(skill);
        // sort the available skills by name
        this.availableSkills.sort((a, b) => a.name.localeCompare(b.name));
        this.filteredSkills = [...this.availableSkills];
        // update the user in the database
        const formattedSkills = this.selectedSkills.map(entry => ({
          skill: entry.skill._id,
          level: entry.skill.level,
          addedAt: entry.addedAt,
          addedBy: entry.addedBy?._id
        }));
        const updatedUser: Partial<User> = {
          ...this.user,
          skills: formattedSkills as any
        };
        this.userService.updateUser(this.userId, updatedUser).subscribe({
          next: () => {
            this.dialogService.showSuccess({
              title: 'Erfolg',
              message: `Skill "${skill.name}" wurde erfolgreich entfernt.`,
              buttonText: 'OK'
            });
          },
          error: (error) => {
            console.error('Fehler beim Entfernen des Skills:', error);
            // restore the original state
            this.selectedSkills.push({ skill });
            this.availableSkills = this.filterOutAssignedSkills(this.availableSkills);
            this.filteredSkills = [...this.availableSkills];
            this.dialogService.showError(
              'Fehler',
              'Der Skill konnte nicht entfernt werden. Bitte versuchen Sie es später erneut.'
            );
          }
        });
      }
    });
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
   * Generates the initials from first and last name
   */
  getInitials(firstName: string, lastName: string): string {
    console.log('Generating initials for:', { firstName, lastName });
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    console.log('Generated initials:', initials);
    return initials;
  }

  /**
   * Formats the user role for display
   */
  formatRole(role?: string): string {
    if (!role) return '';
    
    // Mapping of roles
    const roleMap: { [key: string]: string } = {
      'ADMIN': 'Administrator',
      'COMPETENCE_LEADER': 'Competence Leader',
      'LECTURER': 'Lecturer'
    };

    return roleMap[role] || role;
  }
}

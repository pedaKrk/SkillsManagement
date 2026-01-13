// Import required Angular modules and services
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, FormControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import { SkillService } from '../../../core/services/skill/skill.service';
import { UserRole } from '../../../models/enums/user-roles.enum';
import { SkillLevel } from '../../../models/enums/skill-level.enum';
import { NgZone } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { startWith, map } from 'rxjs/operators';

interface Skill {
  _id: string;
  name: string;
  parentId?: string;
  children?: Skill[];
}

@Component({
  selector: 'app-add-user',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    RouterModule, 
    TranslateModule
  ],
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.scss']
})
export class AddUserComponent implements OnInit, OnDestroy {
  // Form properties
  addUserForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  success = '';

  // User role enum für Typsicherheit
  userRoleEnum = UserRole;

  // Available roles
  roles = [
    { id: UserRole.ADMIN, name: 'AdministratorIn', value: UserRole.ADMIN },
    { id: UserRole.COMPETENCE_LEADER, name: 'KompetenzleiterIn', value: UserRole.COMPETENCE_LEADER },
    { id: UserRole.LECTURER, name: 'LektorIn', value: UserRole.LECTURER }
  ];

  // Skills from database
  availableSkills: Skill[] = [];
  filteredSkills: Skill[] = [];
  isLoadingSkills = false;
  skillsError: string | null = null;
  skillSearchControl = new FormControl('');
  isSkillDropdownOpen = false;
  private destroy$ = new Subject<void>();
  
  // Selected skills with levels
  selectedSkillsWithLevels: Map<string, { skillId: string, level: SkillLevel }> = new Map();
  skillLevels = Object.values(SkillLevel);
  skillLevelDropdownState: { [skillId: string]: boolean } = {};
  
  // for permission control
  isAdminOrCompetenceLeader: boolean = false;
  currentUserId: string = '';
  
  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private skillService: SkillService,
    private ngZone: NgZone,
    private translateService: TranslateService
  ) {
    // Initialize add user form with required fields
    this.addUserForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      title: [''], // Optional title field
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      employmentType: ['Internal', Validators.required],
      role: [UserRole.LECTURER, Validators.required], // Default role is LektorIn
      phoneNumber: [''], // Optional phone number field
      skills: this.formBuilder.array([])
    });
  }

  ngOnInit() {
    // Check user permissions
    this.checkUserPermissions();
    
    // Subscribe to filtered skills from service
    this.skillService.getFilteredSkills(
      this.skillSearchControl.valueChanges.pipe(
        map(value => value || ''),
        startWith('')
      )
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (result) => {
        this.availableSkills = result.skills;
        this.filteredSkills = result.skills;
        this.isLoadingSkills = result.isLoading;
        this.skillsError = result.error;
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    document.removeEventListener('click', this.handleOutsideClick);
  }

  // Retry loading skills
  retryLoadSkills() {
    // Clear cache to force reload
    this.skillService['allSkillsCache'] = null;
    this.skillService['allSkillsSubject'].next([]);
    
    // Re-subscribe to trigger reload
    this.skillService.getFilteredSkills(
      this.skillSearchControl.valueChanges.pipe(
        map(value => value || ''),
        startWith('')
      )
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (result) => {
        this.availableSkills = result.skills;
        this.filteredSkills = result.skills;
        this.isLoadingSkills = result.isLoading;
        this.skillsError = result.error;
      }
    });
  }

  // Toggle skill dropdown
  toggleSkillDropdown() {
    this.isSkillDropdownOpen = !this.isSkillDropdownOpen;
    console.log('Dropdown toggled:', this.isSkillDropdownOpen);
    
    // if the dropdown is opened, add an event listener
    if (this.isSkillDropdownOpen) {
      // add a delay to prevent the current click from closing the dropdown immediately
      setTimeout(() => {
        // add an event listener for clicks outside the dropdown
        document.addEventListener('click', this.handleOutsideClick);
      }, 0);
      
      // if no skills are loaded, trigger reload
      if (this.availableSkills.length === 0 && !this.isLoadingSkills && !this.skillsError) {
        console.log('No skills available, reloading...');
        this.retryLoadSkills();
      }
    } else {
      // remove the event listener when the dropdown is closed
      document.removeEventListener('click', this.handleOutsideClick);
    }
  }

  // handler for clicks outside the dropdown
  handleOutsideClick = (event: MouseEvent) => {
    // check if the click was outside the dropdown
    const dropdownElement = document.querySelector('.dropdown-wrapper');
    if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
      // close the dropdown and remove the event listener
      this.isSkillDropdownOpen = false;
      document.removeEventListener('click', this.handleOutsideClick);
      console.log('Dropdown closed by outside click');
      
      // trigger change detection
      this.ngZone.run(() => {});
    }
  }

  // Close skill dropdown
  closeSkillDropdown() {
    if (this.isSkillDropdownOpen) {
      this.isSkillDropdownOpen = false;
      // remove the event listener
      document.removeEventListener('click', this.handleOutsideClick);
      console.log('Dropdown closed');
    }
  }

  // get selected skills names for display
  getSelectedSkillsNames(): string[] {
    return this.skillsFormArray.controls
      .map(control => {
        const skillId = control.value;
        const skill = this.availableSkills.find(s => s._id === skillId);
        return skill ? skill.name : '';
      })
      .filter(name => name !== '');
  }

  // get selected skill name by ID
  getSelectedSkillName(skillId: string): string {
    const skill = this.availableSkills.find(s => s._id === skillId);
    return skill ? skill.name : '';
  }

  // getter for skills FormArray
  get skillsFormArray() {
    return this.addUserForm.get('skills') as FormArray;
  }

  // Toggle skill selection
  toggleSkill(skillId: string, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    
    const index = this.findSkillIndexInFormArray(skillId);
    if (index === -1) {
      // add skill with default level (Beginner)
      this.skillsFormArray.push(this.formBuilder.control(skillId));
      this.selectedSkillsWithLevels.set(skillId, {
        skillId: skillId,
        level: SkillLevel.BEGINNER
      });
    } else {
      // remove skill
      this.skillsFormArray.removeAt(index);
      this.selectedSkillsWithLevels.delete(skillId);
      this.skillLevelDropdownState[skillId] = false;
    }
  }

  // Set skill level
  setSkillLevel(skillId: string, level: SkillLevel) {
    if (this.selectedSkillsWithLevels.has(skillId)) {
      this.selectedSkillsWithLevels.set(skillId, {
        skillId: skillId,
        level: level
      });
    }
  }

  // Get skill level
  getSkillLevel(skillId: string): SkillLevel {
    const skillData = this.selectedSkillsWithLevels.get(skillId);
    return skillData?.level || SkillLevel.BEGINNER;
  }

  // Get skill level as string for ngClass
  getSkillLevelClass(skillId: string): string {
    return this.getSkillLevel(skillId).toLowerCase();
  }


  // check if a skill is selected
  isSkillSelected(skillId: string): boolean {
    return this.findSkillIndexInFormArray(skillId) !== -1;
  }

  // get index of a skill in the FormArray
  private findSkillIndexInFormArray(skillId: string): number {
    return this.skillsFormArray.controls.findIndex(control => control.value === skillId);
  }

  /**
   * Checks the permissions of the logged in user
   */
  checkUserPermissions(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.currentUserId = currentUser.id;
      
      // Check if user is admin or competence leader
      this.isAdminOrCompetenceLeader = currentUser.role === UserRole.ADMIN || 
                                       currentUser.role === UserRole.COMPETENCE_LEADER;
      
      console.log('Add User - User permissions:', { 
        isAdminOrCompetenceLeader: this.isAdminOrCompetenceLeader,
        currentUserId: this.currentUserId,
        userRole: currentUser.role
      });
      
      // If not admin or competence leader, redirect to unauthorized page
      if (!this.isAdminOrCompetenceLeader) {
        this.router.navigate(['/unauthorized']);
      }
    } else {
      // If no user is logged in, redirect to login
      this.router.navigate(['/login']);
    }
  }

  // handle form submission
  onSubmit() {
    this.submitted = true;
    this.success = '';

    // return if form is invalid
    if (this.addUserForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';

    // get form values
    const currentUser = this.authService.currentUserValue;
    const currentUserId = currentUser?.id;
    
    if (!currentUserId) {
      this.error = 'Sie müssen angemeldet sein, um einen Benutzer zu erstellen.';
      this.loading = false;
      return;
    }
    
    // Convert skill IDs to the format expected by the backend
    // Backend expects: { skill: ObjectId, levelHistory: [{ level, changedAt, changedBy }] }
    const formattedSkills = this.skillsFormArray.value.map((skillId: string) => {
      const skillData = this.selectedSkillsWithLevels.get(skillId);
      const level = skillData?.level || SkillLevel.BEGINNER;
      
      return {
        skill: skillId,
        levelHistory: [{
          level: level,
          changedAt: new Date(),
          changedBy: currentUserId
        }]
      };
    });

    const userData = {
      username: this.addUserForm.get('username')?.value,
      email: this.addUserForm.get('email')?.value,
      title: this.addUserForm.get('title')?.value,
      firstName: this.addUserForm.get('firstName')?.value,
      lastName: this.addUserForm.get('lastName')?.value,
      employmentType: this.addUserForm.get('employmentType')?.value,
      role: this.addUserForm.get('role')?.value,
      phoneNumber: this.addUserForm.get('phoneNumber')?.value,
      skills: formattedSkills
    };

    // call adminCreateUser method from auth service
    this.authService.adminCreateUser(userData).subscribe({
      next: () => {
        // show success message and reset form
        this.success = 'Benutzer wurde erfolgreich erstellt';
        this.addUserForm.reset({
          employmentType: 'Internal',
          role: UserRole.LECTURER
        });
        // clear skills
        while (this.skillsFormArray.length) {
          this.skillsFormArray.removeAt(0);
        }
        this.selectedSkillsWithLevels.clear();
        this.skillLevelDropdownState = {};
        this.submitted = false;
        this.loading = false;
      },
      error: error => {
        console.error('User creation error:', error);
        // handle different error cases
        if (error.status === 400) {
          this.error = error.error?.message || 'Ungültige Eingabedaten';
        } else if (error.status === 409) {
          this.error = 'Benutzername oder E-Mail bereits vergeben';
        } else if (error.status === 0) {
          this.error = 'Verbindung zum Server fehlgeschlagen. Bitte überprüfen Sie Ihre Internetverbindung.';
        } else if (error.status === 500) {
          this.error = 'Serverfehler bei der Erstellung. Bitte versuchen Sie es später erneut.';
        } else {
          this.error = `Fehler bei der Benutzererstellung: ${error.error?.message || 'Unbekannter Fehler'}`;
        }
        this.loading = false;
      }
    });
  }
} 
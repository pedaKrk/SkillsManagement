// Import required Angular modules and services
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, FormControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { API_CONFIG } from '../../../core/config/api.config';
import { UserRole } from '../../../models/enums/user-roles.enum';
import { NgZone } from '@angular/core';

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
    HttpClientModule
  ],
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.scss']
})
export class AddUserComponent implements OnInit {
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
  
  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private http: HttpClient,
    private ngZone: NgZone
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
    this.loadSkills();
    
    // Subscribe to search input changes
    this.skillSearchControl.valueChanges.subscribe(searchTerm => {
      this.filterSkills(searchTerm || '');
    });
  }

  // Load skills from database
  loadSkills() {
    this.isLoadingSkills = true;
    this.skillsError = null;
    
    console.log('Loading skills from:', `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.skills.all}`);
    
    this.http.get<Skill[]>(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.skills.all}`)
      .subscribe({
        next: (skills) => {
          console.log('Skills loaded successfully:', skills);
          if (skills && Array.isArray(skills)) {
            this.availableSkills = skills;
            this.filteredSkills = [...skills];
            console.log('Available skills count:', this.availableSkills.length);
            
            // if no skills are loaded, load dummy skills
            if (this.availableSkills.length === 0) {
              this.loadDummySkills();
            }
          } else {
            console.error('Received skills are not an array:', skills);
            this.skillsError = 'Ungültiges Datenformat für Skills erhalten.';
            this.loadDummySkills();
          }
          this.isLoadingSkills = false;
        },
        error: (error) => {
          console.error('Fehler beim Laden der Skills:', error);
          let errorMessage = 'Skills konnten nicht geladen werden. ';
          
          if (error.status === 0) {
            errorMessage += 'Keine Verbindung zum Server möglich. Bitte überprüfen Sie Ihre Internetverbindung.';
          } else if (error.status === 404) {
            errorMessage += 'Skills-Endpunkt nicht gefunden.';
          } else if (error.status === 500) {
            errorMessage += 'Serverfehler beim Laden der Skills.';
          } else {
            errorMessage += 'Bitte versuchen Sie es später erneut.';
          }
          
          this.skillsError = errorMessage;
          this.isLoadingSkills = false;
          
          // if there is an error, load dummy skills
          this.loadDummySkills();
        }
      });
  }
  
  // load dummy skills for testing
  loadDummySkills() {
    console.log('Loading dummy skills for testing');
    this.availableSkills = [
      { _id: 'skill1', name: 'JavaScript' },
      { _id: 'skill2', name: 'TypeScript' },
      { _id: 'skill3', name: 'Angular' },
      { _id: 'skill4', name: 'React' },
      { _id: 'skill5', name: 'Node.js' },
      { _id: 'skill6', name: 'Express' },
      { _id: 'skill7', name: 'MongoDB' },
      { _id: 'skill8', name: 'SQL' }
    ];
    this.filteredSkills = [...this.availableSkills];
    this.skillsError = null;
    this.isLoadingSkills = false;
  }

  // Filter skills based on search term
  filterSkills(searchTerm: string) {
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
      
      // if no skills are loaded, load them
      if (this.availableSkills.length === 0 && !this.isLoadingSkills && !this.skillsError) {
        console.log('No skills available, reloading...');
        this.loadSkills();
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
      // add skill
      this.skillsFormArray.push(this.formBuilder.control(skillId));
    } else {
      // remove skill
      this.skillsFormArray.removeAt(index);
    }
  }

  // check if a skill is selected
  isSkillSelected(skillId: string): boolean {
    return this.findSkillIndexInFormArray(skillId) !== -1;
  }

  // get index of a skill in the FormArray
  private findSkillIndexInFormArray(skillId: string): number {
    return this.skillsFormArray.controls.findIndex(control => control.value === skillId);
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
    const userData = {
      username: this.addUserForm.get('username')?.value,
      email: this.addUserForm.get('email')?.value,
      title: this.addUserForm.get('title')?.value,
      firstName: this.addUserForm.get('firstName')?.value,
      lastName: this.addUserForm.get('lastName')?.value,
      employmentType: this.addUserForm.get('employmentType')?.value,
      role: this.addUserForm.get('role')?.value,
      phoneNumber: this.addUserForm.get('phoneNumber')?.value,
      skills: this.skillsFormArray.value
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

  retryLoadSkills() {
    this.loadSkills();
  }
} 
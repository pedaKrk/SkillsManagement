import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule } from '@angular/material/dialog';
import { DialogService, ConfirmDialogConfig, FormDialogConfig } from '../../core/services/dialog/dialog.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { SkillService } from '../../core/services/skill/skill.service';
import { UserService } from '../../core/services/user/user.service';
import { Skill } from '../../models/skill.model';
import { AuthService } from '../../core/services/auth/auth.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { UserRole } from '../../models/enums/user-roles.enum';
import { Router } from '@angular/router';

interface SkillWithChildren extends Skill {
  children?: SkillWithChildren[];
  isExpanded?: boolean;
  isEditing?: boolean;
  tempName?: string;
}

@Component({
  selector: 'app-skill-edit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule,
    MatTooltipModule,
    TranslateModule
  ],
  templateUrl: './skill-edit.component.html',
  styleUrls: ['./skill-edit.component.scss'],
  animations: [
    trigger('expandCollapse', [
      state('void', style({
        height: '0',
        opacity: '0'
      })),
      state('*', style({
        height: '*',
        opacity: '1'
      })),
      transition('void <=> *', [
        animate('300ms ease-in-out')
      ])
    ])
  ]
})
export class SkillEditComponent implements OnInit {
  skillTree: SkillWithChildren[] = [];
  isAllExpanded = false;
  currentUser: any = null;
  isAdmin = false;
  tutorialShown = false;
  showDetailedHelp = false;

  constructor(
    private skillService: SkillService,
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private translateService: TranslateService,
    private dialogService: DialogService
  ) {}

  ngOnInit() {
    this.loadSkills();
    this.loadCurrentUser();
    this.checkTutorialStatus();
  }

  loadCurrentUser() {
    const authUser = this.authService.currentUserValue;
    if (authUser) {
      this.userService.getUserProfile().subscribe({
        next: (userProfile) => {
          this.currentUser = userProfile;
          this.isAdmin = userProfile && (userProfile.role === UserRole.ADMIN || userProfile.role === UserRole.COMPETENCE_LEADER);
          
          // Redirect if not admin
          if (!this.isAdmin) {
            this.router.navigate(['/main']);
          }
        },
        error: (error) => {
          console.error('Error loading user profile:', error);
          this.router.navigate(['/main']);
        }
      });
    } else {
      this.router.navigate(['/main']);
    }
  }

  private loadSkills() {
    // Save current expansion states
    const expansionStates = this.saveExpansionStates();
    
    this.skillService.getAllSkills().subscribe({
      next: (skills: Skill[]) => {
        console.log('Received skills:', skills);
        this.skillTree = this.buildHierarchy(skills);
        // Restore expansion states
        this.restoreExpansionStates(expansionStates);
      },
      error: (error) => {
        console.error('Error fetching skills:', error);
      }
    });
  }

  private saveExpansionStates(): { [id: string]: boolean } {
    const states: { [id: string]: boolean } = {};
    
    const saveStatesRecursive = (skills: SkillWithChildren[]) => {
      skills.forEach(skill => {
        if (skill.isExpanded !== undefined) {
          states[skill._id] = skill.isExpanded;
        }
        if (skill.children) {
          saveStatesRecursive(skill.children);
        }
      });
    };
    
    saveStatesRecursive(this.skillTree);
    return states;
  }

  private restoreExpansionStates(states: { [id: string]: boolean }) {
    const restoreStatesRecursive = (skills: SkillWithChildren[]) => {
      skills.forEach(skill => {
        if (states[skill._id] !== undefined) {
          skill.isExpanded = states[skill._id];
        }
        if (skill.children) {
          restoreStatesRecursive(skill.children);
        }
      });
    };
    
    restoreStatesRecursive(this.skillTree);
  }

  private scrollToNewSkill(skillName: string) {
    console.log('Looking for skill:', skillName);
    
    // Try multiple times with increasing delays to ensure DOM is updated
    const tryScroll = (attempt: number = 1) => {
      console.log(`Scroll attempt ${attempt} for skill: ${skillName}`);
      
      // Find the skill element by name - try different selectors
      const selectors = [
        '.skill-content span',  // Root skills: <span>{{ root.name }}</span>
        '.skill-content .skill-name',  // Child skills might have .skill-name
        '.skill-name',
        '.root-node span',
        '.skill-row span',
        '.skill-content'  // Fallback to the entire skill-content div
      ];
      
      let targetElement: Element | null = null;
      
      for (const selector of selectors) {
        const skillElements = document.querySelectorAll(selector);
        console.log(`Found ${skillElements.length} elements with selector: ${selector}`);
        
        for (let i = 0; i < skillElements.length; i++) {
          const element = skillElements[i];
          const elementText = element.textContent?.trim();
          console.log(`Element ${i}: "${elementText}"`);
          
          if (elementText === skillName) {
            targetElement = element;
            console.log('Found matching skill element!');
            break;
          }
        }
        
        if (targetElement) break;
      }
      
      if (targetElement) {
        console.log('Scrolling to skill element');
        // Scroll to the skill with smooth behavior
        targetElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
        
        // Add a temporary highlight effect
        const skillRow = targetElement.closest('.skill-row, .child-grandchild-group, .skill-node');
        if (skillRow) {
          skillRow.classList.add('new-skill-highlight');
          setTimeout(() => {
            skillRow.classList.remove('new-skill-highlight');
          }, 2000);
        }
      } else if (attempt < 5) {
        // Try again after a longer delay
        console.log(`Skill not found, retrying in ${attempt * 200}ms...`);
        setTimeout(() => tryScroll(attempt + 1), attempt * 200);
      } else {
        console.log('Skill not found after 5 attempts');
      }
    };
    
    // Start trying after a short delay
    setTimeout(() => tryScroll(), 100);
  }

  private buildHierarchy(skills: Skill[]): SkillWithChildren[] {
    const skillMap: { [id: string]: SkillWithChildren } = {};
    const rootSkills: SkillWithChildren[] = [];

    // Create skill map
    skills.forEach(skill => {
      skillMap[skill._id] = { ...skill, children: [], isExpanded: false };
    });

    // Build hierarchy
    skills.forEach(skill => {
      if (skill.parent_id) {
        const parent = skillMap[skill.parent_id];
        if (parent) {
          parent.children!.push(skillMap[skill._id]);
        }
      } else {
        rootSkills.push(skillMap[skill._id]);
      }
    });

    return rootSkills;
  }

  toggleExpand(skill: SkillWithChildren) {
    skill.isExpanded = !skill.isExpanded;
  }

  toggleAll() {
    this.isAllExpanded = !this.isAllExpanded;
    this.skillTree.forEach(root => {
      root.isExpanded = this.isAllExpanded;
      if (root.children) {
        root.children.forEach(child => {
          child.isExpanded = this.isAllExpanded;
        });
      }
    });
  }

  // Admin-Funktionen
  startEditing(skill: SkillWithChildren) {
    skill.isEditing = true;
    skill.tempName = skill.name;
   
    setTimeout(() => {
      const inputElement = document.querySelector('.edit-input') as HTMLInputElement;
      if (inputElement) {
        inputElement.focus();
        inputElement.select();
      }
    }, 100);
  }

  saveEdit(skill: SkillWithChildren) {
    if (skill.tempName && skill.tempName.trim() !== '') {
      const newName = skill.tempName.trim();
      
      if (newName === skill.name) {
        skill.isEditing = false;
        skill.tempName = '';
        return;
      }
      
      // Update the skill name
      skill.name = newName;
      this.skillService.updateSkill(skill._id, { name: skill.name }).subscribe({
        next: (updatedSkill) => {
          skill.isEditing = false;
          skill.tempName = '';
          console.log('Skill updated successfully:', updatedSkill);
          
          // Reload skills
          this.loadSkills();
        },
        error: (error: any) => {
          console.error('Error updating skill:', error);
          // Revert to original name on error
          skill.name = skill.tempName || skill.name;
          skill.tempName = skill.name;
          skill.isEditing = false;
        }
      });
    } else {
      // Empty name - revert to original
      skill.tempName = skill.name;
      skill.isEditing = false;
    }
  }

  cancelEdit(skill: SkillWithChildren) {
    skill.isEditing = false;
    skill.tempName = '';
  }

  deleteSkill(skill: SkillWithChildren) {
    const skillName = skill.name || 'Unknown Skill';
    
    const deleteMessageTemplate = this.translateService.instant('SKILL_EDIT.DELETE_MESSAGE');
    const deleteMessage = deleteMessageTemplate.replace('{skillName}', skillName);
    
    const dialogConfig: ConfirmDialogConfig = {
      title: this.translateService.instant('SKILL_EDIT.DELETE_CONFIRMATION'),
      message: deleteMessage,
      confirmText: this.translateService.instant('COMMON.DELETE'),
      cancelText: this.translateService.instant('COMMON.CANCEL'),
      dangerMode: true,
      closeOnBackdropClick: false
    };
    
    this.dialogService.showConfirmation(dialogConfig).subscribe(confirmed => {
      if (confirmed) {
        this.skillService.deleteSkill(skill._id).subscribe({
          next: () => {
            this.loadSkills(); // Reload skills after deletion
          },
          error: (error: any) => {
            console.error('Error deleting skill:', error);
          }
        });
      }
    });
  }

  addSkill(parentId?: string) {
    const dialogTitle = parentId 
      ? this.translateService.instant('SKILL_EDIT.ADD_CHILD_SKILL') 
      : this.translateService.instant('SKILL_EDIT.ADD_ROOT_SKILL');
    
    const formConfig: FormDialogConfig = {
      title: dialogTitle,
      message: this.translateService.instant('SKILL_EDIT.ADD_SKILL_PROMPT'),
      formFields: [
        {
          id: 'skillName',
          name: 'skillName',
          label: this.translateService.instant('SKILL_EDIT.SKILL_NAME_PLACEHOLDER'),
          type: 'text',
          required: true,
          placeholder: this.translateService.instant('SKILL_EDIT.SKILL_NAME_PLACEHOLDER')
        }
      ],
      submitText: this.translateService.instant('COMMON.ADD') || 'Hinzufügen',
      cancelText: this.translateService.instant('COMMON.CANCEL'),
      closeOnBackdropClick: false
    };
    
    this.dialogService.showFormDialog(formConfig).subscribe(result => {
      if (result && result.skillName && result.skillName.trim() !== '') {
        const skillData = {
          name: result.skillName.trim(),
          parent_id: parentId || null
        };
        
        console.log('Creating skill with data:', skillData);
        
              this.skillService.createSkill(skillData).subscribe({
                next: (newSkill) => {
                  // Show success dialog
                  const successMessage = parentId 
                    ? this.translateService.instant('SKILL_EDIT.CHILD_SKILL_ADDED_SUCCESS')
                    : this.translateService.instant('SKILL_EDIT.ROOT_SKILL_ADDED_SUCCESS');
                  
                  this.dialogService.showSuccess({
                    title: this.translateService.instant('SKILL_EDIT.SUCCESS_TITLE'),
                    message: successMessage,
                    buttonText: this.translateService.instant('COMMON.OK') || 'OK',
                    closeOnBackdropClick: true
                  }).subscribe();
                  
                  this.loadSkills(); // Reload skills after creation
                  
                  // Scroll to the new skill after a short delay to allow DOM update
                  setTimeout(() => {
                    this.scrollToNewSkill(skillData.name);
                  }, 100);
                },
          error: (error: any) => {
            console.error('Error creating skill:', error);
            
            // Show error message to user
            let errorMessage = 'Ein Fehler ist aufgetreten beim Erstellen des Skills.';
            
            // Extract error message from different possible locations
            if (error.error && error.error.message) {
              errorMessage = error.error.message;
            } else if (error.message) {
              errorMessage = error.message;
            }
            
            console.log('Full error object:', error);
            console.log('Extracted error message:', errorMessage);
            
            // Translate error message if it's about duplicate names
            if (errorMessage.includes('already exists')) {
              // Try different patterns to extract the skill name
              let skillName = 'diesen Namen';
              
              // Pattern 1: "A skill with the name 'JavaScript' already exists"
              const match1 = errorMessage.match(/name ['"]([^'"]+)['"]/);
              if (match1) {
                skillName = match1[1];
              } else {
                // Pattern 2: Any text in quotes (fallback)
                const match2 = errorMessage.match(/['"]([^'"]+)['"]/);
                if (match2) {
                  skillName = match2[1];
                }
              }
              
              console.log('Extracted skill name:', skillName);
              
              // Use direct string interpolation instead of translation
              const currentLang = this.translateService.currentLang || 'de';
              if (currentLang === 'de') {
                errorMessage = `Ein Skill mit dem Namen "${skillName}" existiert bereits. Bitte wählen Sie einen anderen Namen.`;
              } else {
                errorMessage = `A skill with the name "${skillName}" already exists. Please choose a different name.`;
              }
            }
            
            this.dialogService.showError(
              this.translateService.instant('SKILL_EDIT.ERROR_TITLE'),
              errorMessage
            ).subscribe();
          }
        });
      }
    });
  }

  goBack() {
    this.router.navigate(['/main']);
  }

  // Tutorial-Funktionen
  checkTutorialStatus() {
    const tutorialDismissed = localStorage.getItem('skill-edit-tutorial-dismissed');
    this.tutorialShown = tutorialDismissed === 'true';
  }

  showTutorial() {
    this.tutorialShown = false;
    localStorage.removeItem('skill-edit-tutorial-dismissed');
  }

  hideTutorial() {
    this.tutorialShown = true;
    localStorage.setItem('skill-edit-tutorial-dismissed', 'true');
  }

  openDetailedHelp() {
    this.showDetailedHelp = true;
  }

  hideDetailedHelp() {
    this.showDetailedHelp = false;
  }
}

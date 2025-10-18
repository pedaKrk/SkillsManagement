import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
  searchPath?: string;
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
  searchQuery = '';
  searchResults: SkillWithChildren[] = [];
  isSearching = false;

  constructor(
    private skillService: SkillService,
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private translateService: TranslateService,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef
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
    const expansionStates = this.saveExpansionStates();
    
    this.skillService.getAllSkills().subscribe({
      next: (skills: Skill[]) => {
        this.skillTree = this.buildHierarchy(skills);
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

  private scrollToNewSkill(skillName: string, parentId?: string) {
    const tryScroll = (attempt: number = 1) => {
      let searchContainer: Element | Document = document;
      
      if (parentId) {
        const parentElement = document.querySelector(`[data-skill-id="${parentId}"]`);
        if (parentElement) {
          const childrenArea = parentElement.querySelector('.child-grandchild-row, .grandchildren');
          if (childrenArea) {
            searchContainer = childrenArea;
          }
        }
      }
      
      const selectors = [
        '.skill-content span',
        '.skill-content .skill-name',
        '.skill-name',
        '.root-node span',
        '.skill-row span',
        '.skill-content'
      ];
      
      let targetElement: Element | null = null;
      
      for (const selector of selectors) {
        const skillElements = searchContainer.querySelectorAll(selector);
        
        for (let i = 0; i < skillElements.length; i++) {
          const element = skillElements[i];
          const elementText = element.textContent?.trim();
          
          if (elementText && elementText.includes(skillName)) {
            const spanElement = element.querySelector('span');
            if (spanElement && spanElement.textContent?.trim() === skillName) {
              targetElement = spanElement;
              break;
            } else if (elementText === skillName) {
              targetElement = element;
              break;
            }
          }
        }
        
        if (targetElement) break;
      }
      
      if (targetElement) {
        targetElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
        
        const skillRow = targetElement.closest('.skill-row, .child-grandchild-group, .skill-node');
        if (skillRow) {
          skillRow.classList.add('new-skill-highlight');
          setTimeout(() => {
            skillRow.classList.remove('new-skill-highlight');
          }, 2000);
        }
      } else if (attempt < 10) {
        setTimeout(() => tryScroll(attempt + 1), attempt * 300);
      }
    };
    
    setTimeout(() => {
      tryScroll();
    }, 100);
  }

  private scrollToNewSkillAfterDOMUpdate(skillName: string, parentId?: string) {
    const observer = new MutationObserver((mutations) => {
      let searchContainer: Element | Document = document;
      
      if (parentId) {
        const parentElement = document.querySelector(`[data-skill-id="${parentId}"]`);
        if (parentElement) {
          const childrenArea = parentElement.querySelector('.child-grandchild-row, .grandchildren');
          if (childrenArea) {
            searchContainer = childrenArea;
          }
        }
      }
      
      const skillElements = searchContainer.querySelectorAll('.skill-content span');
      let found = false;
      
      for (let i = 0; i < skillElements.length; i++) {
        const element = skillElements[i];
        const elementText = element.textContent?.trim();
        
        if (elementText && elementText.includes(skillName)) {
          found = true;
          
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
          
          const skillRow = element.closest('.skill-row, .child-grandchild-group, .skill-node');
          if (skillRow) {
            skillRow.classList.add('new-skill-highlight');
            setTimeout(() => {
              skillRow.classList.remove('new-skill-highlight');
            }, 2000);
          }
          
          break;
        }
      }
      
      if (found) {
        observer.disconnect();
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    setTimeout(() => {
      observer.disconnect();
    }, 5000);
  }

  private scrollToNewSkillSimple(skillName: string, parentId?: string) {
    if (parentId) {
      this.ensureParentExpanded(parentId);
      
      setTimeout(() => {
        this.searchAndScrollToSkill(skillName, parentId);
      }, 300);
    } else {
      this.searchAndScrollToSkill(skillName);
    }
  }

  private searchAndScrollToSkill(skillName: string, parentId?: string) {
    const tryScroll = (attempt: number = 1) => {
      let searchContainer: Element | Document = document;
      
      if (parentId) {
        const parentElement = document.querySelector(`[data-skill-id="${parentId}"]`);
        if (parentElement) {
          const childrenArea = parentElement.querySelector('.child-grandchild-row, .grandchildren');
          if (childrenArea) {
            searchContainer = childrenArea;
          } else {
            searchContainer = document;
          }
        }
      }
      
      const selectors = [
        '.skill-content span',
        '.child-node .skill-content span',
        '.grandchild-node .skill-content span',
        'input[type="text"]',
        '.edit-input',
        '.skill-content',
        'span'
      ];
      
      let targetElement: Element | null = null;
      
      for (const selector of selectors) {
        const elements = searchContainer.querySelectorAll(selector);
        
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          let elementText = element.textContent?.trim();
          
          if (element instanceof HTMLInputElement) {
            elementText = element.value?.trim();
          }
          
          if (elementText && elementText.includes(skillName)) {
            targetElement = element;
            break;
          }
        }
        
        if (targetElement) break;
      }
      
      if (targetElement) {
        this.ensureAllParentsExpanded(targetElement);
        
        targetElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
        
        const skillRow = targetElement.closest('.skill-row, .child-grandchild-group, .skill-node');
        if (skillRow) {
          skillRow.classList.add('new-skill-highlight');
          setTimeout(() => {
            skillRow.classList.remove('new-skill-highlight');
          }, 2000);
        }
      } else if (attempt < 5) {
        setTimeout(() => tryScroll(attempt + 1), attempt * 500);
      }
    };
    
    tryScroll();
  }

  private ensureAllParentsExpanded(targetElement: Element) {
    let currentElement = targetElement.closest('.skill-node');
    
    while (currentElement) {
      const parentRow = currentElement.closest('.skill-row');
      if (parentRow) {
        const skillId = parentRow.getAttribute('data-skill-id');
        if (skillId) {
          this.expandSkillById(skillId);
        }
      }
      
      const nextParent = currentElement.closest('.skill-node')?.parentElement?.closest('.skill-node');
      currentElement = nextParent || null;
    }
  }

  private expandSkillById(skillId: string) {
    const expandSkillRecursive = (skills: SkillWithChildren[]): boolean => {
      for (const skill of skills) {
        if (skill._id === skillId) {
          skill.isExpanded = true;
          return true;
        }
        
        if (skill.children && skill.children.length > 0) {
          if (expandSkillRecursive(skill.children)) {
            skill.isExpanded = true;
            return true;
          }
        }
      }
      return false;
    };
    
    expandSkillRecursive(this.skillTree);
  }

  private ensureParentExpanded(parentId: string) {
    const expandParentRecursive = (skills: SkillWithChildren[]): boolean => {
      for (const skill of skills) {
        if (skill._id === parentId) {
          skill.isExpanded = true;
          return true;
        }
        
        if (skill.children && skill.children.length > 0) {
          if (expandParentRecursive(skill.children)) {
            skill.isExpanded = true;
            return true;
          }
        }
      }
      return false;
    };
    
    expandParentRecursive(this.skillTree);
  }

  private buildHierarchy(skills: Skill[]): SkillWithChildren[] {
    const skillMap: { [id: string]: SkillWithChildren } = {};
    const rootSkills: SkillWithChildren[] = [];

    skills.forEach(skill => {
      skillMap[skill._id] = { ...skill, children: [], isExpanded: false };
    });

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
      
      skill.name = newName;
      this.skillService.updateSkill(skill._id, { name: skill.name }).subscribe({
        next: (updatedSkill) => {
          skill.isEditing = false;
          skill.tempName = '';
          this.loadSkills();
        },
        error: (error: any) => {
          console.error('Error updating skill:', error);
          skill.name = skill.tempName || skill.name;
          skill.tempName = skill.name;
          skill.isEditing = false;
        }
      });
    } else {
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
            this.loadSkills();
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
        
        this.skillService.createSkill(skillData).subscribe({
          next: (newSkill) => {
            const successMessage = parentId 
              ? this.translateService.instant('SKILL_EDIT.CHILD_SKILL_ADDED_SUCCESS')
              : this.translateService.instant('SKILL_EDIT.ROOT_SKILL_ADDED_SUCCESS');
            
            this.dialogService.showSuccess({
              title: this.translateService.instant('SKILL_EDIT.SUCCESS_TITLE'),
              message: successMessage,
              buttonText: this.translateService.instant('COMMON.OK') || 'OK',
              closeOnBackdropClick: true
            }).subscribe();
            
            this.loadSkills();
            
            if (parentId) {
              this.ensureParentExpanded(parentId);
            }
            
            setTimeout(() => {
              this.scrollToNewSkillSimple(skillData.name, parentId);
            }, 1000);
          },
          error: (error: any) => {
            console.error('Error creating skill:', error);
            
            let errorMessage = 'Ein Fehler ist aufgetreten beim Erstellen des Skills.';
            
            if (error.error && error.error.message) {
              errorMessage = error.error.message;
            } else if (error.message) {
              errorMessage = error.message;
            }
            
            if (errorMessage.includes('already exists')) {
              let skillName = 'diesen Namen';
              
              const match1 = errorMessage.match(/name ['"]([^'"]+)['"]/);
              if (match1) {
                skillName = match1[1];
              } else {
                const match2 = errorMessage.match(/['"]([^'"]+)['"]/);
                if (match2) {
                  skillName = match2[1];
                }
              }
              
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

  // Search functionality
  onSearchInput(event: any) {
    this.searchQuery = event.target.value.trim();
    
    if (this.searchQuery.length === 0) {
      this.clearSearch();
      return;
    }
    
    if (this.searchQuery.length < 2) {
      return;
    }
    
    this.performSearch();
  }

  performSearch() {
    this.isSearching = true;
    this.searchResults = [];
    
    const searchRecursive = (skills: SkillWithChildren[], parentPath: string = '') => {
      skills.forEach(skill => {
        const fullPath = parentPath ? `${parentPath} > ${skill.name}` : skill.name;
        
        if (skill.name.toLowerCase().includes(this.searchQuery.toLowerCase())) {
          this.searchResults.push({
            ...skill,
            searchPath: fullPath
          } as any);
        }
        
        if (skill.children && skill.children.length > 0) {
          searchRecursive(skill.children, fullPath);
        }
      });
    };
    
    searchRecursive(this.skillTree);
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchResults = [];
    this.isSearching = false;
  }

  scrollToSkill(skill: SkillWithChildren) {
    this.clearSearch();
    
    // Find the actual skill in the tree (not the search result copy)
    let actualSkill: SkillWithChildren | null = null;
    const findActualSkill = (skills: SkillWithChildren[]): SkillWithChildren | null => {
      for (const s of skills) {
        if (s._id === skill._id) {
          return s;
        }
        if (s.children && s.children.length > 0) {
          const found = findActualSkill(s.children);
          if (found) return found;
        }
      }
      return null;
    };
    
    actualSkill = findActualSkill(this.skillTree);
    
    if (!actualSkill) {
      // Fallback: just scroll without expansion
      setTimeout(() => {
        this.scrollToSkillElement(skill.name, false);
      }, 100);
      return;
    }
    
    // Check if it's a root skill
    const isRootSkill = this.skillTree.some(root => root._id === actualSkill._id);
    
    // Find and expand all parent skills to make the target skill visible
    const expandAllParents = (targetSkill: SkillWithChildren, skills: SkillWithChildren[], parentPath: SkillWithChildren[] = []): boolean => {
      for (const skill of skills) {
        if (skill._id === targetSkill._id) {
          // Found the target skill, expand all parents in the path
          parentPath.forEach(parent => {
            if (!parent.isExpanded) {
              parent.isExpanded = true;
            }
          });
          return true;
        }
        
        if (skill.children && skill.children.length > 0) {
          const newPath = [...parentPath, skill];
          if (expandAllParents(targetSkill, skill.children, newPath)) {
            return true;
          }
        }
      }
      return false;
    };
    
    // Expand all parents to make the skill visible
    expandAllParents(actualSkill, this.skillTree);
    
    // For root skills, also expand their children
    if (isRootSkill) {
      // Expand the root skill
      if (!actualSkill.isExpanded) {
        actualSkill.isExpanded = true;
      }
      
      // Expand all children recursively
      const expandAllChildren = (children: SkillWithChildren[]) => {
        children.forEach(child => {
          if (!child.isExpanded) {
            child.isExpanded = true;
          }
          if (child.children && child.children.length > 0) {
            expandAllChildren(child.children);
          }
        });
      };
      
      if (actualSkill.children && actualSkill.children.length > 0) {
        expandAllChildren(actualSkill.children);
      }
    }
    
    // Force change detection
    this.cdr.detectChanges();
    
    // Wait for DOM update, then scroll
    setTimeout(() => {
      this.scrollToSkillElement(skill.name, isRootSkill);
    }, 300);
  }

  private scrollToSkillElement(skillName: string, isRootSkill: boolean = false) {
    const selectors = [
      '.skill-content span',
      '.child-node .skill-content span',
      '.grandchild-node .skill-content span',
      'input[type="text"]',
      '.edit-input',
      '.skill-content',
      'span'
    ];
    
    let targetElement: Element | null = null;
    
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      
      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        let elementText = element.textContent?.trim();
        
        if (element instanceof HTMLInputElement) {
          elementText = element.value?.trim();
        }
        
        if (elementText && elementText.includes(skillName)) {
          targetElement = element;
          break;
        }
      }
      
      if (targetElement) break;
    }
    
    if (targetElement) {
      targetElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
      
      const skillRow = targetElement.closest('.skill-row, .child-grandchild-group, .skill-node');
      if (skillRow) {
        // Different highlight for root skills
        if (isRootSkill) {
          skillRow.classList.add('root-skill-highlight');
          setTimeout(() => {
            skillRow.classList.remove('root-skill-highlight');
          }, 3000); // Longer highlight for root skills
        } else {
          skillRow.classList.add('new-skill-highlight');
          setTimeout(() => {
            skillRow.classList.remove('new-skill-highlight');
          }, 2000);
        }
      }
    }
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
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
    private dialog: MatDialog,
    private router: Router,
    private translateService: TranslateService
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
    this.skillService.getAllSkills().subscribe({
      next: (skills: Skill[]) => {
        console.log('Received skills:', skills);
        this.skillTree = this.buildHierarchy(skills);
      },
      error: (error) => {
        console.error('Error fetching skills:', error);
      }
    });
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
    const deleteMessage = this.translateService.instant('SKILL_EDIT.DELETE_MESSAGE', { skillName: skill.name });
    if (confirm(deleteMessage)) {
      this.skillService.deleteSkill(skill._id).subscribe({
        next: () => {
          this.loadSkills(); // Reload skills after deletion
        },
        error: (error: any) => {
          console.error('Error deleting skill:', error);
        }
      });
    }
  }

  addSkill(parentId?: string) {
    const promptMessage = this.translateService.instant('SKILL_EDIT.ADD_SKILL_PROMPT');
    const newSkillName = prompt(promptMessage);
    if (newSkillName && newSkillName.trim() !== '') {
      const skillData = {
        name: newSkillName.trim(),
        parent_id: parentId || null
      };
      
      this.skillService.createSkill(skillData).subscribe({
        next: () => {
          this.loadSkills(); // Reload skills after creation
        },
        error: (error: any) => {
          console.error('Error creating skill:', error);
        }
      });
    }
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

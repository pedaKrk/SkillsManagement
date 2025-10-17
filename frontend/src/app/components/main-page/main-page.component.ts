import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { SkillService } from '../../core/services/skill/skill.service';
import { UserService } from '../../core/services/user/user.service';
import { Skill } from '../../models/skill.model';
import { AuthService } from '../../core/services/auth/auth.service';
import { PdfService } from '../../core/services/pdf/pdf.service';
import { TranslateModule } from '@ngx-translate/core';

interface SkillWithChildren extends Skill {
  children?: SkillWithChildren[];
  isExpanded?: boolean;
}

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    TranslateModule
  ],
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.scss'],
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
export class MainPageComponent implements OnInit {
  skillTree: SkillWithChildren[] = [];
  isAllExpanded = false;
  currentUser: any = null;

  constructor(
    private skillService: SkillService,
    private authService: AuthService,
    private userService: UserService,
    private pdfService: PdfService
  ) {}

  ngOnInit() {
    this.loadSkills();
    this.loadCurrentUser();
  }

  loadCurrentUser() {
    const authUser = this.authService.currentUserValue;
    if (authUser) {
      this.userService.getUserProfile().subscribe({
        next: (userProfile) => {
          this.currentUser = userProfile;
        },
        error: (error) => {
          console.error('Error loading user profile:', error);
        }
      });
    }
  }

  private loadSkills() {
    this.skillService.getAllSkills().subscribe({
      next: (skills: Skill[]) => {
        this.skillTree = this.buildHierarchy(skills);
      },
      error: (error) => {
        console.error('Error fetching skills:', error);
      }
    });
  }

  private buildHierarchy(skills: Skill[]): SkillWithChildren[] {
    const skillMap: { [id: string]: SkillWithChildren } = {};

    // Map skills by ID
    skills.forEach(skill => {
      skillMap[skill._id] = { ...skill, children: [] };
    });

    const rootSkills: SkillWithChildren[] = [];

    // Build hierarchy
    skills.forEach(skill => {
      if (skill.parent_id) {
        skillMap[skill.parent_id]?.children?.push(skillMap[skill._id]);
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


  exportSkillTreeAsPDF() {
    this.pdfService.generateSkillTreePDF();
  }
} 
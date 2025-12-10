import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { UserSkillEntry } from '../../models/user.model';

@Component({
  selector: 'app-user-skills-display',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule
  ],
  templateUrl: './user-skills-display.component.html',
  styleUrl: './user-skills-display.component.scss'
})
export class UserSkillsDisplayComponent {
  @Input() userSkills: UserSkillEntry[] | undefined = [];

  /**
   * Returns the name of a skill, regardless of the format
   * @param skill The skill object
   * @returns The name of the skill
   */
  getSkillName(skill: any): string {
    if (!skill) return 'Unbekannte Fähigkeit';
    if (typeof skill === 'string') return skill;
    if (skill.name) return skill.name;
    if (skill._id) return `Fähigkeit (ID: ${skill._id.substring(0, 5)}...)`;
    return 'Unbekannte Fähigkeit';
  }

  /**
   * Returns the CSS class for a skill level
   * @param level The skill level
   * @returns The CSS class name
   */
  getSkillLevelClass(level: string): string {
    if (!level) {
      return '';
    }
    return level.toLowerCase();
  }
}


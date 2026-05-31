import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { UserFutureSkillEntry } from '../../models/user.model';

@Component({
  selector: 'app-user-future-skills-display',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule
  ],
  templateUrl: './user-future-skills-display.component.html',
  styleUrl: './user-future-skills-display.component.scss'
})
export class UserFutureSkillsDisplayComponent {
  @Input() futureSkills: UserFutureSkillEntry[] | undefined = [];

  getSkillName(futureSkill: UserFutureSkillEntry): string {
    return futureSkill.skill_id?.name || futureSkill.name || 'Future Skill';
  }

  getSkillLevelClass(level: string): string {
    return level ? level.toLowerCase() : '';
  }
}

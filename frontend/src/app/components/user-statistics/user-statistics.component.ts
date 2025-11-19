import {Component, Input, OnInit, SimpleChanges} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DashboardService} from '../../core';
import {TranslatePipe} from '@ngx-translate/core';
import {User} from '../../models/user.model';
import {SkillLevel} from '../../models/enums/skill-level.enum';

import {RadarChartComponent} from '../radar-chart/radar-chart.component';
import {BarChartComponent} from '../bar-chart/bar-chart.component';

interface UserSkillDistributionEntry {
  rootSkillId: string;
  rootSkillName: string;
  count: number;
}

@Component({
  selector: 'app-user-statistics',
  imports: [
    CommonModule, TranslatePipe, RadarChartComponent, BarChartComponent
  ],
  templateUrl: './user-statistics.component.html',
  styleUrl: './user-statistics.component.scss'
})
export class UserStatisticsComponent implements OnInit {

  @Input() user!: User;
  indicators: any[] = [];
  counts: number[] = [];

  xData: string[] = [];
  yData: number[] = [];

  skillLevelMapping: Record<SkillLevel, number> = {
    [SkillLevel.BEGINNER]: 1,
    [SkillLevel.INTERMEDIATE]: 2,
    [SkillLevel.ADVANCED]: 3
  };

  constructor(private dashboardService: DashboardService) { }

  ngOnInit(): void {
    if(!this.user){
      throw new Error("UserStatisticsComponent requires user");
    }

    this.dashboardService.getUserSkillDistribution(this.user._id || '').subscribe((data: UserSkillDistributionEntry[]) => {
      this.counts = data.map(entry => entry.count);
      this.indicators = data.map(entry => ({
        name: entry.rootSkillName,
        max: Math.max(...this.counts, 1)
      }))
    })

    const skills = this.user.skills ?? [];
    console.log(skills);

    this.xData = skills.map(entry => entry.skill.name);

    this.yData = skills.map(entry => {
      const latestLevelStr = entry.levelHistory?.[entry.levelHistory.length - 1]?.level;
      const levelEnum = this.mapStringToSkillLevel(latestLevelStr);
      return this.skillLevelMapping[levelEnum];
    });

  }

  private mapStringToSkillLevel(levelStr: string | undefined): SkillLevel {
    switch (levelStr?.toLowerCase()) {
      case 'beginner':
        return SkillLevel.BEGINNER;
      case 'intermediate':
        return SkillLevel.INTERMEDIATE;
      case 'advanced':
        return SkillLevel.ADVANCED;
      default:
        return SkillLevel.BEGINNER;
    }
  }
}

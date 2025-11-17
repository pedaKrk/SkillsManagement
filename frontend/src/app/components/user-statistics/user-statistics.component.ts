import {Component, Input, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {NgxChartsModule} from '@swimlane/ngx-charts';
import {SkillService} from '../../core/services/skill/skill.service';
import {DashboardService} from '../../core';
import {TranslatePipe} from '@ngx-translate/core';
import {User, UserSkillEntry} from '../../models/user.model';
import {NgxEchartsDirective, provideEchartsCore} from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { RadarChart} from 'echarts/charts';
import { TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components';
import { CanvasRenderer} from 'echarts/renderers';
import {Skill} from '../../models/skill.model';

echarts.use([RadarChart, TooltipComponent, LegendComponent, TitleComponent , CanvasRenderer]);

interface SkillWithChildren extends Skill {
  children?: SkillWithChildren[];
}

@Component({
  selector: 'app-user-statistics',
  imports: [
    CommonModule, NgxChartsModule, TranslatePipe, NgxEchartsDirective
  ],
  providers: [
    provideEchartsCore({echarts}),
  ],
  templateUrl: './user-statistics.component.html',
  styleUrl: './user-statistics.component.scss'
})
export class UserStatisticsComponent implements OnInit {

  @Input() user!: User;

  rootSkills: Skill[] = [];
  radarOptions: any;

  constructor(private dashboardService: DashboardService, private skillService: SkillService) { }

  ngOnInit(): void {
    if(!this.user){
      throw new Error("UserStatisticsComponent requires user");
    }

    this.skillService.getAllSkills().subscribe((allSkills: Skill[]) => {
      const skillMap: { [id: string]: Skill } = {};
      allSkills.forEach(skill => skillMap[skill._id] = skill);

      // Root-Skills ermitteln
      const rootSkills: Skill[] = allSkills.filter(skill => !skill.parent_id);
      this.rootSkills = rootSkills;

      // Zähler für jeden Root-Skill vorbereiten
      const rootSkillCounts: { [id: string]: number } = {};
      rootSkills.forEach(root => rootSkillCounts[root._id] = 0);

      // Jeden User-Skill hoch traversieren bis zum Root
      this.user.skills?.forEach(userSkillEntry => {
        let skill = skillMap[userSkillEntry.skill._id];
        while (skill) {
          if (!skill.parent_id) {
            rootSkillCounts[skill._id]++;
            break;
          }
          skill = skillMap[skill.parent_id];
        }
      });

      // Array für Chart vorbereiten
      const data = rootSkills.map(root => ({
        name: root.name,
        count: rootSkillCounts[root._id] || 0
      }));

      // todo: bug: 4 user skills aber nur 3 punkte???
      console.log("user skills:" + this.user.skills?.map(s => s.skill.name));
      console.log(data);

      this.radarOptions = {
        title: {
          text: 'Basic Radar Chart'
        },
        legend: {
          data: ['User Skills']
        },
        radar: {
          // shape: 'circle',
          indicator: data.map(s => ({name: s.name, max: Math.min(s.count)})),
        },
        series: [
          {
            name: 'User Skills',
            type: 'radar',
            symbol: 'none',
            areaStyle: {},
            data: [
              {
                value: data.map(s => s.count),
                name: 'Skills'
              },
            ]
          }
        ]
      };
    })
  }
}

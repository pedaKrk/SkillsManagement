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

    this.skillService.getRootSkills().subscribe(
      (allSkills: Skill[]) => {
        this.rootSkills = allSkills;

        this.radarOptions = {
          title: {
            text: 'Basic Radar Chart'
          },
          legend: {
            data: ['Allocated Budget', 'Actual Spending']
          },
          radar: {
            // shape: 'circle',
            indicator: this.rootSkills.map(skill => ({
              name: skill.name,
              max: 5,
            }))
          },
          series: [
            {
              name: 'User Skills',
              type: 'radar',
              symbol: 'none',
              areaStyle: {},
              data: [
                {
                  value: [2, 4, 0, 0, 5, 3, 5, 0, 0, 0, 0,0,0, 3, 1, 0],
                  name: 'Skills'
                },
              ]
            }
          ]
        };
      }
    )
  }
}

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

interface UserSkillDistributionEntry {
  rootSkillId: string;
  rootSkillName: string;
  count: number;
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

  radarOptions: any;

  constructor(private dashboardService: DashboardService) { }

  ngOnInit(): void {
    if(!this.user){
      throw new Error("UserStatisticsComponent requires user");
    }

    this.dashboardService.getUserSkillDistribution(this.user._id || '').subscribe((data: UserSkillDistributionEntry[]) => {
      const counts = data.map(entry => entry.count);
      const indicators = data.map(entry => ({
        name: entry.rootSkillName,
        max: Math.max(...counts, 1)
      }))
      this.radarOptions = {
        title: {
          text: 'Basic Radar Chart'
        },
        legend: {
          data: ['User Skills']
        },
        radar: {
          // shape: 'circle',
          indicator: indicators,
        },
        series: [
          {
            name: 'User Skills',
            type: 'radar',
            symbol: 'none',
            areaStyle: {},
            data: [
              {
                value: counts,
                name: 'Skills'
              },
            ]
          }
        ]
      };
    })
  }
}

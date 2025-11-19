import {Component, Input, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {NgxChartsModule} from '@swimlane/ngx-charts';
import {DashboardService} from '../../core';
import {TranslatePipe} from '@ngx-translate/core';
import {User} from '../../models/user.model';
import {NgxEchartsDirective, provideEchartsCore} from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { RadarChart} from 'echarts/charts';
import { TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components';
import { CanvasRenderer} from 'echarts/renderers';
import {RadarChartComponent} from '../radar-chart/radar-chart.component';

echarts.use([RadarChart, TooltipComponent, LegendComponent, TitleComponent , CanvasRenderer]);

interface UserSkillDistributionEntry {
  rootSkillId: string;
  rootSkillName: string;
  count: number;
}

@Component({
  selector: 'app-user-statistics',
  imports: [
    CommonModule, NgxChartsModule, TranslatePipe, NgxEchartsDirective, RadarChartComponent
  ],
  providers: [
    provideEchartsCore({echarts}),
  ],
  templateUrl: './user-statistics.component.html',
  styleUrl: './user-statistics.component.scss'
})
export class UserStatisticsComponent implements OnInit {

  @Input() user!: User;
  indicators: any[] = [];
  counts: number[] = [];

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
  }
}

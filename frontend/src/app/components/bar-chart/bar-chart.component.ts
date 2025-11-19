import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {NgxEchartsDirective, provideEchartsCore} from 'ngx-echarts';
import {BarChart} from 'echarts/charts';
import {GridComponent} from 'echarts/components';
import * as echarts from 'echarts/core';

echarts.use([BarChart, GridComponent]);

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [
    NgxEchartsDirective
  ],
  providers: [
    provideEchartsCore({echarts})
  ],
  templateUrl: './bar-chart.component.html',
  styleUrl: './bar-chart.component.scss'
})
export class BarChartComponent implements OnChanges {
  @Input() xAxisData: Array<any> = [];
  @Input() yAxisData: Array<any> = [];

  options: any;

  private levelLabels: Record<number, string> = {
    1: 'Beginner',
    2: 'Intermediate',
    3: 'Advanced'
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.xAxisData?.length || !this.yAxisData?.length) {
      this.options = undefined;
      return;
    }

    this.options = {
      title: {
        text: 'Skills Overview',
        left: 'center'
      },
      tooltip: {
        formatter: (params: any) => {
          const skillName = this.xAxisData[params.dataIndex];
          const level = this.levelLabels[params.data];
          return `${skillName}: ${level}`;
        }
      },
      xAxis: {
        type: 'category',
        data: this.xAxisData,
        axisLabel: { rotate: 30 },
        name: 'Skill'
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 3,
        interval: 1,
        axisLabel: {
          formatter: (value: number) => this.levelLabels[value] ?? ''
        },
        name: 'Level'
      },
      series: [
        {
          type: 'bar',
          data: this.yAxisData,
          itemStyle: {
            color: (params: any) => {
              const colors: Record<number, string> = { 1: '#a3c4f3', 2: '#66b266', 3: '#f08080' };
              return colors[params.data] ?? '#888';
            }
          }
        }
      ],
      grid: {
        left: '10%',
        right: '10%',
        bottom: '15%',
        containLabel: true
      }
    };
  }

}

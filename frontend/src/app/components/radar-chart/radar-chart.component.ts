import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {NgxEchartsDirective, provideEchartsCore} from 'ngx-echarts';

import { RadarChart } from 'echarts/charts';
import { TooltipComponent, LegendComponent, TitleComponent} from 'echarts/components';
import { CanvasRenderer} from 'echarts/renderers';

import * as echarts from 'echarts/core';
echarts.use([RadarChart, TooltipComponent, LegendComponent, TitleComponent , CanvasRenderer]);


@Component({
  selector: 'app-radar-chart',
  imports: [
    NgxEchartsDirective
  ],
  providers: [
    provideEchartsCore({echarts}),
  ],
  standalone: true,
  templateUrl: './radar-chart.component.html',
  styleUrl: './radar-chart.component.scss'
})
export class RadarChartComponent implements OnChanges {
  @Input() title: string = "Radar";
  @Input() name: string = "Data";
  @Input() indicators: any[] = []
  @Input() counts: number[] = []

  radarOptions: any;

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.indicators?.length || !this.counts?.length) {
      this.radarOptions = undefined;
      return;
    }

    this.radarOptions = {
      title: {
        text: this.title,
      },
      legend: {
        data: [this.name],
      },
      radar: {
        indicator: this.indicators,
      },
      series: [
        {
          name: this.name,
          type: 'radar',
          symbol: 'none',
          areaStyle: {},
          data: [
            {
              value: this.counts,
              name: this.name,
            },
          ]
        }
      ]
    };
  }
}

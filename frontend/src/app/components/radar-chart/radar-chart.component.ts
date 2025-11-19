import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {NgxEchartsDirective} from 'ngx-echarts';

@Component({
  selector: 'app-radar-chart',
  imports: [
    NgxEchartsDirective
  ],
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

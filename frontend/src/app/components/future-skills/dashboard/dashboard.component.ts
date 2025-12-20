import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { DashboardService } from '../../../core';
import { Color, ScaleType, LegendPosition } from '@swimlane/ngx-charts';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgxChartsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {

  // Chart data
  skillsLevelMatrixData: any[] = [];
  skillsData: any[] = [];
  skillsByLevelData: any[] = [];
  lecturersSkillFields: any[] = [];

  // ✅ Professional color palette for all charts
  colorScheme: Color = {
    name: 'dashboard',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: [
      '#2563EB', // Blue
      '#16A34A', // Green
      '#DC2626', // Red
      '#7C3AED', // Purple
      '#F59E0B'  // Amber
    ]
  };
  LegendPosition = LegendPosition;

  // Axis helpers
  yAxisTickFormatting = (value: number) => {
    return Number.isInteger(value) ? value.toString() : '';
  };

  get yMax(): number {
    return 10;
  }

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {

    this.dashboardService.getSkillsLevelMatrix().subscribe(data => {
      this.skillsLevelMatrixData = data;
    });

    this.dashboardService.getSkillsByLevel().subscribe(data => {
      this.skillsByLevelData = data;
    });

    this.dashboardService.getSkillsPopularity().subscribe(data => {
      this.skillsData = data;
    });

    this.dashboardService.getLecturersSkillFields().subscribe(data => {
      this.lecturersSkillFields = data;
    });
  }
}

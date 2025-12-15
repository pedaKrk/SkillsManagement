import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { DashboardService } from '../../../core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgxChartsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  skillsLevelMatrixData: any[] = [];
  skillsData: any[] = [];
  skillsByLevelData: any[] = [];
  skillsPerFieldData: any[] = [];
  goalsPerformanceData: any[] = [];
  lecturersSkillFields: any[] = [];

  yAxisTickFormatting = (value: number) => {
    return Number.isInteger(value) ? value.toString() : '';
  };

  get yMax(): number {
    return 10;  // adjust if you want to compute dynamically
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

    this.dashboardService.getGoalsPerformance().subscribe(data => {
      this.goalsPerformanceData = data;
    });

    this.dashboardService.getLecturersSkillFields().subscribe(data => {
      this.lecturersSkillFields = data;
    });

  }

}

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
  // KPI values (computed, not hard-coded)
  totalSkills = 0;
  skillLevelsCount = 0;
  lecturersCount= 0;

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

      // Total skills = number of skills in matrix
      this.totalSkills = data.length;

      // Skill levels = unique level names across all skills
      const levels = new Set<string>();
      data.forEach((skill: any) => {
        skill.series?.forEach((s: any) => levels.add(s.name));
      });
      this.skillLevelsCount = levels.size;
    });

    this.dashboardService.getSkillsByLevel().subscribe(data => {
      this.skillsByLevelData = data;

      // Fallback: number of levels returned
      if (!this.skillLevelsCount) {
        this.skillLevelsCount = data.length;
      }
    });

    this.dashboardService.getSkillsPopularity().subscribe(data => {
      this.skillsData = data;

      // Alternative source for total skills if needed
      if (!this.totalSkills) {
        this.totalSkills = data.length;
      }
    });

    this.dashboardService.getLecturersSkillFields().subscribe(data => {
      this.lecturersSkillFields = data;

      // count unique lecturers
      const uniqueLecturers = new Set(
        data
          .map((item: any) => item.lecturer_id)
          .filter(Boolean)
      );

      this.lecturersCount = uniqueLecturers.size;
    });
  }
  }

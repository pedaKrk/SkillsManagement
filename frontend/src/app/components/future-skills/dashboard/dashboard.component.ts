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

  // =========================
  // CHART DATA
  // =========================
  skillsLevelMatrixData: any[] = [];
  skillsData: any[] = [];
  skillsByLevelData: any[] = [];
  lecturersSkillFields: any[] = [];
  futureSkillsGrowthData: any[] = [];
  lecturerEngagementData: any[] = [];

  // =========================
  // FILTER
  // =========================
  topLevelSkills: any[] = [];
  selectedRootSkillId: string | null = null;

  // =========================
  // KPI VALUES
  // =========================
  totalSkills = 0;
  skillLevelsCount = 0;
  lecturersCount = 0;

  // =========================
  // COLOR SCHEME
  // =========================
  colorScheme: Color = {
    name: 'dashboard',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: [
      '#2563EB',
      '#16A34A',
      '#DC2626',
      '#7C3AED',
      '#F59E0B'
    ]
  };

  LegendPosition = LegendPosition;

  // =========================
  // AXIS HELPERS
  // =========================
  yAxisTickFormatting = (value: number) =>
    Number.isInteger(value) ? value.toString() : '';

  get yMax(): number {
    return 10;
  }

  constructor(private dashboardService: DashboardService) {}

  // =========================
  // INIT
  // =========================
  ngOnInit(): void {

    // Load filter dropdown
    this.dashboardService.getTopLevelSkills().subscribe(data => {
      this.topLevelSkills = data;
    });

    // Load default dashboard
    this.loadDefaultDashboard();
  }

  // =========================
  // DEFAULT DASHBOARD
  // =========================
  loadDefaultDashboard(): void {

    this.dashboardService.getSkillsLevelMatrix().subscribe(data => {
      this.skillsLevelMatrixData = data;
      this.totalSkills = data.length;

      const levels = new Set<string>();
      data.forEach((skill: any) =>
        skill.series?.forEach((s: any) => levels.add(s.name))
      );
      this.skillLevelsCount = levels.size;
    });

    this.dashboardService.getSkillsByLevel().subscribe(data => {
      this.skillsByLevelData = data;
    });

    this.dashboardService.getLecturersCount().subscribe(res => {
      this.lecturersCount = res.value;
    });

    this.dashboardService.getSkillsPopularity().subscribe(data => {
      this.skillsData = data;
    });

    this.dashboardService.getLecturersSkillFields().subscribe(data => {
      this.lecturersSkillFields = data;
    });

    this.dashboardService.getLecturerEngagementTop5().subscribe(data => {
      this.lecturerEngagementData = data;
    });

    this.dashboardService.getFutureSkillsGrowth().subscribe(data => {
      this.futureSkillsGrowthData = [
        { name: 'Future Skills', series: data }
      ];
    });
  }

  // =========================
  // FILTERED DASHBOARD
  // =========================
  loadDashboardByRootSkill(rootSkillId: string): void {

    this.dashboardService.getDashboardByRootSkill(rootSkillId)
      .subscribe(data => {

        this.skillsLevelMatrixData = data.skillsLevelMatrix;
        this.skillsByLevelData = data.skillsByLevel;
        this.skillsData = data.skillsPopularity;
        this.lecturersSkillFields = data.lecturersSkillFields;
        this.lecturerEngagementData = data.lecturerEngagementTop5;
        this.lecturersCount = data.lecturersCount;

        // KPI recalculation
        this.totalSkills = data.skillsLevelMatrix.length;

        const levels = new Set<string>();
        data.skillsLevelMatrix.forEach((skill: any) =>
          skill.series?.forEach((s: any) => levels.add(s.name))
        );
        this.skillLevelsCount = levels.size;

        this.futureSkillsGrowthData = [
          { name: 'Future Skills', series: data.futureSkillsGrowth }
        ];
      });
  }

  // =========================
  // FILTER HANDLER
  // =========================
  onRootSkillChange(rootSkillId: string): void {
    this.selectedRootSkillId = rootSkillId || null;

    if (!this.selectedRootSkillId) {
      this.loadDefaultDashboard();
    } else {
      this.loadDashboardByRootSkill(this.selectedRootSkillId);
    }
  }
}

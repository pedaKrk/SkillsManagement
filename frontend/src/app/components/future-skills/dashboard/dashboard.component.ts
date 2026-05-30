import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { DashboardService } from '../../../core';
import { Color, ScaleType, LegendPosition } from '@swimlane/ngx-charts';

type DashboardMode = 'future' | 'normal';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgxChartsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  dashboardMode: DashboardMode = 'future';

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

  get dashboardTitle(): string {
    return this.dashboardMode === 'future'
      ? 'Future-Skills Dashboard'
      : 'Skills Dashboard';
  }

  get dashboardSubtitle(): string {
    return this.dashboardMode === 'future'
      ? 'Overview of future skills, levels and field distribution'
      : 'Overview of current skills, levels and field distribution';
  }

  get growthChartTitle(): string {
    return this.dashboardMode === 'future'
      ? 'Future Skills Growth Over Time'
      : 'Skills Growth Over Time';
  }

  get growthYAxisLabel(): string {
    return this.dashboardMode === 'future'
      ? 'Future Skills Count'
      : 'Skills Count';
  }

  get engagementYAxisLabel(): string {
    return this.dashboardMode === 'future'
      ? 'Number of Future Skills'
      : 'Number of Skills';
  }

  // =========================
  // AXIS HELPERS
  // =========================
  yAxisTickFormatting = (value: number) =>
    Number.isInteger(value) ? value.toString() : '';

  get yMax(): number {
    const maxValue = Math.max(
      0,
      ...this.skillsData.map(skill => Number(skill.value) || 0)
    );

    return Math.max(10, maxValue);
  }

  constructor(private dashboardService: DashboardService) {
  }

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
    if (this.dashboardMode === 'normal') {
      this.loadNormalSkillsDashboard();
      return;
    }

    this.dashboardService.getSkillsLevelMatrix().subscribe(data => {
      this.skillsLevelMatrixData = [...data];
      this.totalSkills = data.length;

      const levels = new Set<string>();
      data.forEach((skill: any) =>
        skill.series?.forEach((s: any) => levels.add(s.name))
      );
      this.skillLevelsCount = levels.size;
    });

    this.dashboardService.getSkillsByLevel().subscribe(data => {
      this.skillsByLevelData = [...data];
    });

    this.dashboardService.getLecturersCount().subscribe(res => {
      this.lecturersCount = res.value;
    });

    this.dashboardService.getSkillsPopularity().subscribe(data => {
      this.skillsData = [...data];
    });

    this.dashboardService.getLecturersSkillFields().subscribe(data => {
      this.lecturersSkillFields = [...data];
    });

    this.dashboardService.getLecturerEngagementTop5().subscribe(data => {
      this.lecturerEngagementData = [...data];
    });

    this.dashboardService.getFutureSkillsGrowth().subscribe(data => {
      this.futureSkillsGrowthData = [
        {
          name: 'Future Skills',
          series: [...data]
        }
      ];
    });
  }


  // =========================
  // FILTERED DASHBOARD
  // =========================
  loadDashboardByRootSkill(rootSkillId: string): void {
    if (this.dashboardMode === 'normal') {
      this.loadNormalSkillsDashboard(rootSkillId);
      return;
    }

    this.dashboardService.getDashboardByRootSkill(rootSkillId)
      .subscribe(data => {

        this.skillsLevelMatrixData = [...data.skillsLevelMatrix];
        this.skillsByLevelData = [...data.skillsByLevel];
        this.skillsData = [...data.skillsPopularity];
        this.lecturersSkillFields = [...data.lecturersSkillFields];
        this.lecturerEngagementData = [...data.lecturerEngagementTop5];

        this.futureSkillsGrowthData = [
          {name: 'Future Skills', series: [...data.futureSkillsGrowth]}
        ];

        this.lecturersCount = data.lecturersCount;

        // KPIs
        this.totalSkills = data.skillsLevelMatrix.length;

        const levels = new Set<string>();
        data.skillsLevelMatrix.forEach((skill: any) =>
          skill.series?.forEach((s: any) => levels.add(s.name))
        );
        this.skillLevelsCount = levels.size;
      });
  }


  // =========================
  // FILTER HANDLER
  // =========================
  onRootSkillChange(rootSkillId: string): void {
    this.selectedRootSkillId = rootSkillId || null;

    if (!rootSkillId) {
      this.loadDefaultDashboard();
    } else {
      this.loadDashboardByRootSkill(rootSkillId);
    }
  }

  onDashboardModeChange(mode: DashboardMode): void {
    if (this.dashboardMode === mode) {
      return;
    }

    this.dashboardMode = mode;
    this.loadDashboardForCurrentSelection();
  }

  private loadDashboardForCurrentSelection(): void {
    if (this.selectedRootSkillId) {
      this.loadDashboardByRootSkill(this.selectedRootSkillId);
    } else {
      this.loadDefaultDashboard();
    }
  }

  private loadNormalSkillsDashboard(rootSkillId?: string): void {
    const request = rootSkillId
      ? this.dashboardService.getNormalSkillsDashboardByRootSkill(rootSkillId)
      : this.dashboardService.getNormalSkillsDashboard();

    request.subscribe(data => this.applyNormalSkillsDashboardData(data));
  }

  private applyNormalSkillsDashboardData(data: any): void {
    this.skillsLevelMatrixData = [...data.skillsLevelMatrix];
    this.skillsByLevelData = [...data.skillsByLevel];
    this.skillsData = [...data.skillsPopularity];
    this.lecturersSkillFields = [...data.lecturersSkillFields];
    this.lecturerEngagementData = [...data.lecturerEngagementTop5];

    this.futureSkillsGrowthData = [
      {name: 'Skills', series: [...data.skillsGrowth]}
    ];

    this.lecturersCount = data.lecturersCount;
    this.totalSkills = data.skillsLevelMatrix.length;

    const levels = new Set<string>();
    data.skillsLevelMatrix.forEach((skill: any) =>
      skill.series?.forEach((s: any) => levels.add(s.name))
    );
    this.skillLevelsCount = levels.size;
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  futureSkills = [
    { lecturer: 'doc Alon Iliagouev', skillName: 'Docker', skillLevel: 'Intermediate', expectedDate: '2025-09-01' },
    { lecturer: 'Mag. Mage Tips', skillName: 'Cloud Security', skillLevel: 'Advanced', expectedDate: '2024-12-25' },
    { lecturer: 'bsc Livia Zylja', skillName: 'Cloud Security', skillLevel: 'Beginner', expectedDate: '2025-01-01' }
  ];

  ngOnInit(): void {
    this.createChart();
  }

  createChart(): void {
    const grouped = this.groupByMonth(this.futureSkills);

    const labels = Object.keys(grouped);
    const data = Object.values(grouped);

    new Chart('skillsChart', {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Expected Future Skills',
          data,
          borderColor: '#2196f3',
          borderWidth: 2,
          fill: false,
          pointRadius: 5,
          pointBackgroundColor: '#2196f3',
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Anzahl der Skills' }
          },
          x: {
            title: { display: true, text: 'Monat/Jahr' }
          }
        }
      }
    });
  }

  groupByMonth(data: any[]): Record<string, number> {
    const grouped: Record<string, number> = {};

    data.forEach(skill => {
      const date = new Date(skill.expectedDate);
      const label = date.toLocaleString('en', { month: 'short', year: 'numeric' });

      if (grouped[label]) {
        grouped[label]++;
      } else {
        grouped[label] = 1;
      }
    });

    return grouped;
  }

  get overdueSkills() {
    const today = new Date();
    return this.futureSkills.filter(skill => new Date(skill.expectedDate) < today);
  }

}

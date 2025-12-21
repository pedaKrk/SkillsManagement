import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SkillsOverviewService } from '../../../core/services/future-skills/skills-overview.service';

@Component({
  selector: 'app-skills-overview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './skills-overview.component.html',
  styleUrls: ['./skills-overview.component.scss']
})
export class SkillsOverviewComponent implements OnInit {

  rows: any[] = [];
  filteredRows: any[] = [];
  searchTerm = '';

  constructor(private skillsService: SkillsOverviewService) {}

  ngOnInit(): void {
    this.skillsService.getSkillsOverview().subscribe(data => {
      this.rows = data;
      this.filteredRows = [...data];
    });
  }

  applySearch(): void {
    const term = this.searchTerm.toLowerCase();

    this.filteredRows = this.rows.filter(row =>
      row.user.toLowerCase().includes(term) ||
      row.skill.toLowerCase().includes(term)
    );
  }
}

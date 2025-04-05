import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-plan',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './plan.component.html',
  styleUrls: ['./plan.component.scss']
})
export class PlanComponent implements OnInit {
  skills = [
    { lecturer: 'Dr Sylvia Geyers', skillName: 'DevOps', skillLevel: 'Advanced', expectedDate: '2024-12-13' },
    { lecturer: 'Mag. Mage Tips', skillName: 'Cloud Security', skillLevel: 'Advanced', expectedDate: '2024-12-25' },
    { lecturer: 'bsc Livia Zylja', skillName: 'Cloud Security', skillLevel: 'Beginner', expectedDate: '2025-01-01' },
    { lecturer: 'doc Alon Iliagouev', skillName: 'Docker', skillLevel: 'Intermediate', expectedDate: '2025-09-01' }
  ];

  lecturers = ['Dr Sylvia Geyers', 'Mag. Mage Tips', 'bsc Livia Zylja', 'doc Alon Iliagouev'];
  skillOptions = ['DevOps', 'Cloud Security', 'Docker'];
  skillLevels = ['Beginner', 'Intermediate', 'Advanced'];

  isFilterOpen = false;
  editingIndex: number | null = null;
  originalSkill: any = null;
  addingNewSkill = false;
  newSkill = {
    lecturer: '',
    skillName: '',
    skillLevel: '',
    expectedDate: ''
  };

  ngOnInit(): void {}

  toggleFilterDropdown() {
    this.isFilterOpen = !this.isFilterOpen;
  }

  applyFilters() {
    alert('Filters applied!');
    this.isFilterOpen = false;
  }

  resetFilters() {
    alert('Filters reset!');
  }

  filterSkills(event: Event) {
    const term = (event.target as HTMLInputElement).value.toLowerCase();
    this.skills = this.skills.filter(skill =>
      skill.lecturer.toLowerCase().includes(term) ||
      skill.skillName.toLowerCase().includes(term) ||
      skill.skillLevel.toLowerCase().includes(term)
    );
  }

  addNewSkill() {
    this.addingNewSkill = true;
    this.newSkill = {
      lecturer: '',
      skillName: '',
      skillLevel: '',
      expectedDate: ''
    };
  }

  saveNewSkill() {
    if (this.newSkill.lecturer && this.newSkill.skillName && this.newSkill.skillLevel && this.newSkill.expectedDate) {
      this.skills.push({ ...this.newSkill });
      this.addingNewSkill = false;
    } else {
      alert('Please fill in all fields');
    }
  }

  cancelNewSkill() {
    this.addingNewSkill = false;
  }

  editSkill(index: number) {
    this.editingIndex = index;
    this.originalSkill = { ...this.skills[index] };
  }

  saveEdit() {
    if (this.editingIndex !== null) {
      this.editingIndex = null;
      this.originalSkill = null;
    }
  }

  cancelEdit() {
    if (this.editingIndex !== null) {
      this.skills[this.editingIndex] = { ...this.originalSkill };
      this.editingIndex = null;
      this.originalSkill = null;
    }
  }

  deleteSkill(index: number) {
    const confirmDelete = confirm('Are you sure you want to delete this future-skill?');
    if (confirmDelete) {
      this.skills.splice(index, 1);
    }
  }
}

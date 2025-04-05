import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-manage-progress',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './manage-progress.component.html',
  styleUrls: ['./manage-progress.component.scss']
})
export class ManageProgressComponent implements OnInit {
  // Sample data
  futureSkills = [
    { lecturer: 'Dr Sylvia Geyers', skillName: 'DevOps', skillLevel: 'Advanced', expectedDate: '2024-12-13' },
    { lecturer: 'Mag. Mage Tips', skillName: 'Cloud Security', skillLevel: 'Advanced', expectedDate: '2024-12-25' },
    { lecturer: 'bsc Muster1', skillName: 'Cloud Security', skillLevel: 'Beginner', expectedDate: '2025-01-01' },
    { lecturer: 'doc Muster2', skillName: 'Docker', skillLevel: 'Intermediate', expectedDate: '2025-09-01' }
  ];

  filteredSkills: any[] = [];
  skillLevels = ['Beginner', 'Intermediate', 'Advanced'];
  lecturers = ['Dr Sylvia Geyers', 'Mag. Mage Tips', 'bsc Muster1', 'doc Muster2'];
  skillOptions = ['DevOps', 'Cloud Security', 'Docker'];

  // State variables
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

  ngOnInit(): void {
    this.filteredSkills = [...this.futureSkills];
  }

  // Search
  filterSkills(event: Event) {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredSkills = this.futureSkills.filter(skill =>
      skill.lecturer.toLowerCase().includes(searchTerm) ||
      skill.skillName.toLowerCase().includes(searchTerm) ||
      skill.skillLevel.toLowerCase().includes(searchTerm)
    );
  }

  // Filters
  toggleFilterDropdown() {
    this.isFilterOpen = !this.isFilterOpen;
  }

  applyFilters() {
    alert('Filters applied!');
    this.isFilterOpen = false;
  }

  resetFilters() {
    this.filteredSkills = [...this.futureSkills];
    alert('Filters reset!');
  }

  // Add new skill
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
    if (
      this.newSkill.lecturer &&
      this.newSkill.skillName &&
      this.newSkill.skillLevel &&
      this.newSkill.expectedDate
    ) {
      this.futureSkills.push({ ...this.newSkill });
      this.filteredSkills = [...this.futureSkills];
      this.addingNewSkill = false;
    } else {
      alert('Please fill in all fields');
    }
  }

  cancelNewSkill() {
    this.addingNewSkill = false;
    this.newSkill = { lecturer: '', skillName: '', skillLevel: '', expectedDate: '' };
  }

  // Edit
  editSkill(index: number) {
    this.editingIndex = index;
    this.originalSkill = { ...this.filteredSkills[index] };
  }

  saveEdit() {
    this.editingIndex = null;
    this.originalSkill = null;
    // Changes already bound with ngModel
  }

  cancelEdit() {
    if (this.editingIndex !== null) {
      this.filteredSkills[this.editingIndex] = { ...this.originalSkill };
    }
    this.editingIndex = null;
    this.originalSkill = null;
  }

  deleteSkill(index: number) {
    const confirmation = confirm('Are you sure you want to delete this future-skill?');
    if (confirmation) {
      const skillToDelete = this.filteredSkills[index];
      this.futureSkills = this.futureSkills.filter(skill => skill !== skillToDelete);
      this.filteredSkills = [...this.futureSkills];
    }
  }

  sendMail(skill: any) {
    alert(`Sending mail about: ${skill.skillName} by ${skill.lecturer}`);
  }

  addToSkills(skill: any) {
    alert(`Added "${skill.skillName}" to Skills!`);
  }
}

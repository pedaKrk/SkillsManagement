import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';



@Component({
  selector: 'app-manage-progress',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './manage-progress.component.html',
  styleUrls: ['./manage-progress.component.scss']
})
export class ManageProgressComponent implements OnInit {
  futureSkills = [
    { lecturer: 'Dr Sylvia Geyers', skillName: 'DevOps', skillLevel: 'Advanced', expectedDate: '2024-12-13' },
    { lecturer: 'Mag. Mage Tips', skillName: 'Cloud Security', skillLevel: 'Advanced', expectedDate: '2024-12-25' },
    { lecturer: 'bsc Livia Zylja', skillName: 'Cloud Security', skillLevel: 'Beginner', expectedDate: '2025-01-01' },
    { lecturer: 'doc Alon Iliagouev', skillName: 'Docker', skillLevel: 'Intermediate', expectedDate: '2025-09-01' }
  ];

  filteredSkills: any[] = [];
  isFilterOpen = false;
  skillLevels = ['Beginner', 'Intermediate', 'Advanced'];
  addingNewSkill = false;

  ngOnInit(): void {
    this.filteredSkills = [...this.futureSkills];
  }

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

  filterSkills(event: Event) {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredSkills = this.futureSkills.filter(skill =>
      skill.lecturer.toLowerCase().includes(searchTerm) ||
      skill.skillName.toLowerCase().includes(searchTerm) ||
      skill.skillLevel.toLowerCase().includes(searchTerm)
    );
  }

  lecturers = ['Dr Sylvia Geyers', 'Mag. Mage Tips', 'bsc Muster1', 'doc Muster2'];
  skillOptions = ['DevOps', 'Cloud Security', 'Docker'];

  editingIndex: number | null = null;
  originalSkill: any = null;

  addNewSkill() {
    this.addingNewSkill = true;
  }

  editSkill(index: number) {
    this.editingIndex = index;
    this.originalSkill = { ...this.filteredSkills[index] }; // Save original values
  }
  saveEdit() {
    if (this.editingIndex !== null) {
      console.log('Saving changes for:', this.filteredSkills[this.editingIndex]);
    }
    this.editingIndex = null;
    this.originalSkill = null;
  }

  cancelEdit() {
    if (this.editingIndex !== null) {
      this.filteredSkills[this.editingIndex] = { ...this.originalSkill }; // Restore original values
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

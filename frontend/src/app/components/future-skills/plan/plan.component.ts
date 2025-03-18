import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Needed for [(ngModel)]

@Component({
  selector: 'app-plan',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './plan.component.html',
  styleUrls: ['./plan.component.scss']
})
export class PlanComponent {
  skills = [
    { lecturer: 'Dr Sylvia Geyers', skillName: 'DevOps', skillLevel: 'Advanced', expectedDate: '2024-12-13' },
    { lecturer: 'Mag. Mage Tips', skillName: 'Cloud Security', skillLevel: 'Advanced', expectedDate: '2024-12-25' },
    { lecturer: 'bsc Muster1', skillName: 'Cloud Security', skillLevel: 'Beginner', expectedDate: '2025-01-01' },
    { lecturer: 'doc Muster2', skillName: 'Docker', skillLevel: 'Intermediate', expectedDate: '2025-09-01' }
  ];

  filteredSkills = [...this.skills]; // Copy of skills for filtering
  isFilterOpen = false;
  skillLevels = ['Beginner', 'Intermediate', 'Advanced'];

  toggleFilterDropdown() {
    this.isFilterOpen = !this.isFilterOpen;
  }

  applyFilters() {
    alert('Filters applied!');
    this.isFilterOpen = false; // Close dropdown after applying
  }

  resetFilters() {
    this.filteredSkills = [...this.skills]; // Reset skills to original list
    alert('Filters reset!');
  }

  filterSkills(event: Event) {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredSkills = this.skills.filter(skill =>
      skill.lecturer.toLowerCase().includes(searchTerm) ||
      skill.skillName.toLowerCase().includes(searchTerm) ||
      skill.skillLevel.toLowerCase().includes(searchTerm)
    );
  }

  lecturers = ['Dr Sylvia Geyers', 'Mag. Mage Tips', 'bsc Livia Zylja', 'doc Alon Iliagouev'];
  skillOptions = ['DevOps', 'Cloud Security', 'Docker'];

  editingIndex: number | null = null;
  originalSkill: any = null;

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
    const confirmation = confirm(
      `Are you sure you want to delete this Future-Skill?\n\nThis action cannot be undone.`
    );
    if (confirmation) {
      const skillToDelete = this.filteredSkills[index];
      this.skills = this.skills.filter(skill => skill !== skillToDelete);
      this.filteredSkills = [...this.skills]; // Refresh the filtered list
    }
  }
}

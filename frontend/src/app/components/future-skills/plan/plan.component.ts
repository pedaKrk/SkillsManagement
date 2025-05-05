import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {HttpClientModule, HttpHeaders} from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import {PlanService} from '../../../core';

@Component({
  selector: 'app-plan',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './plan.component.html',
  styleUrls: ['./plan.component.scss']
})
export class PlanComponent implements OnInit {
  searchTerm: string = '';
  allSkills: any[] = [];
  skills: any[] = [];
  editingIndex: number | null = null;
  originalSkill: any = null;

  isFilterOpen = false;
  addingNewSkill = false;
  skillLevels: string[] = [];
  lecturers: any[] = [];
  skillOptions: { _id: string, name: string }[] = [];
  selectedLevel: string = '';
  selectedLecturerId: string = '';
  selectedSkillId: string = '';
  expectedDate: string = '';
  selectedSkill: string = '';

  newSkill = {
    lecturer_id: '',
    skill_id: '',
    future_achievable_level: '',
    target_date: ''
  };

  constructor(private planService: PlanService, private http: HttpClient) {}
  ngOnInit(): void {
    this.getAllSkillNames();
    this.getAllSkillLevels();
    this.loadLecturers()
    this.getAllFutureSkills();
  }

  getAllFutureSkills() {
    this.planService.getAllFutureSkills().subscribe({
      next: (data) => {
        this.skills = data;
        this.allSkills = [...data];
      },
      error: (err) => console.error('Error fetching skills:', err)
    });
  }

  loadLecturers() {
    this.planService.getAllLecturers().subscribe({
      next: (res) => {
        console.log('Lecturers fetched:', res);
        this.lecturers = res;
      },
      error: (err) => {
        console.error('Failed to fetch lecturers:', err);
      }
    });
  }

  getAllSkillNames() {
    this.planService.fetchAllSkillNames().subscribe({
      next: (res) => this.skillOptions = res,
      error: (err) => console.error('Failed to fetch skill names:', err)
    });
  }

  getAllSkillLevels() {
    this.planService.fetchAllSkillLevels().subscribe({
      next: (levels) => {
        this.skillLevels = levels;
      },
      error: (err) => {
        console.error('Error loading skill levels:', err);
      }
    });
  }

  editSkill(index: number) {
    this.editingIndex = index;
    this.originalSkill = { ...this.skills[index] };
  }

  saveEdit() {
    if (this.editingIndex !== null) {
      const updatedSkill = { ...this.skills[this.editingIndex] };

      if (typeof updatedSkill.skill_id === 'object') {
        updatedSkill.skill_id = updatedSkill.skill_id._id;
      }

      if (typeof updatedSkill.lecturer_id === 'object') {
        updatedSkill.lecturer_id = updatedSkill.lecturer_id._id;
      }

      this.planService.updateSkill(updatedSkill._id, updatedSkill).subscribe({
        next: () => {
          this.editingIndex = null;
          this.originalSkill = null;
          this.getAllFutureSkills(); // ✅ Reload fresh data from DB
        },
        error: err => {
          console.error('Update failed:', err);
          alert('Update failed.');
        }
      });
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
    const skill = this.skills[index];
    if (confirm('Are you sure you want to delete this skill?')) {
      this.planService.deleteSkill(skill._id).subscribe({
        next: () => this.skills.splice(index, 1),
        error: err => {
          console.error('Delete failed:', err);
          alert('Delete failed.');
        }
      });
    }
  }

  addNewSkill() {
    this.addingNewSkill = true;
  }

  cancelNewSkill() {
    this.addingNewSkill = false;
    this.newSkill = {
      lecturer_id: '',
      skill_id: '',
      future_achievable_level: '',
      target_date: ''
    };
  }

  saveNewSkill() {
    if (
      this.newSkill.lecturer_id &&
      this.newSkill.skill_id &&
      this.newSkill.future_achievable_level &&
      this.newSkill.target_date
    ) {
      const payload = {
        name: this.skillOptions.find(s => s._id === this.newSkill.skill_id)?.name || 'Unnamed Skill',
        lecturer_id: this.newSkill.lecturer_id,
        skill_id: this.newSkill.skill_id,
        future_achievable_level: this.newSkill.future_achievable_level,
        target_date: new Date(this.newSkill.target_date)
      };


      console.log('✅ Payload being sent:', payload);

      this.planService.createSkill(payload).subscribe({
        next: (created) => {
          this.skills.push(created);
          this.addingNewSkill = false;
          this.newSkill = {
            lecturer_id: '',
            skill_id: '',
            future_achievable_level: '',
            target_date: ''
          };
          this.getAllFutureSkills();
        },
        error: err => {
          console.error('Create failed:', err);
          alert('Failed to create new skill.');
        }
      });
    } else {
      alert('Please fill all fields.');
    }
  }

  filterSkills(event: Event) {
    const value = (event.target as HTMLInputElement).value.toLowerCase();

    this.skills = this.allSkills.filter(skill =>
      skill.skill_id?.name?.toLowerCase().includes(value)
    );
  }

  toggleFilterDropdown() {
    this.isFilterOpen = !this.isFilterOpen;
  }

  applyFilters() {
    const formattedDate = this.expectedDate
      ? new Date(this.expectedDate).toISOString().split('T')[0]
      : '';

    this.skills = this.allSkills.filter(skill => {
      const level = skill.future_achievable_level;
      const lecturerId = skill.lecturer_id?._id || skill.lecturer_id;
      const skillId = skill.skill_id?._id || skill.skill_id;
      const skillDate = skill.target_date ? new Date(skill.target_date).toISOString().split('T')[0] : '';

      const matchLevel = !this.selectedLevel || level === this.selectedLevel;
      const matchLecturer = !this.selectedLecturerId || lecturerId === this.selectedLecturerId;
      const matchSkill = !this.selectedSkillId || skillId === this.selectedSkillId;
      const matchDate = !formattedDate || formattedDate === skillDate;

      return matchLevel && matchLecturer && matchSkill && matchDate;
    });

    console.log('Filtered Skills:', this.skills);
  }

  resetFilters(): void {
    this.selectedLevel = '';
    this.selectedLecturerId = '';
    this.selectedSkillId = '';
    this.expectedDate = '';

    this.getAllFutureSkills();
    this.isFilterOpen = true;
  }

  protected readonly name = name;
}

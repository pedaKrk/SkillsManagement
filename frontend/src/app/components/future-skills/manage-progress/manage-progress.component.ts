import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {ManageProgressService} from '../../../core/services/future-skills/manage-progress.service';
import {AuthService, EmailService} from '../../../core';
import {UserRole} from '../../../models/enums/user-roles.enum';
import {EmploymentType} from '../../../models/enums/employment-type.enum';

// adjust path as needed


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

  emailModalOpen = false;
  emailData = {
    recipient: '',
    subject: '',
    message: ''
  };

  constructor( private mailService: EmailService, private authService: AuthService) {}

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
    const userName = skill.lecturer;
    const skillName = skill.skillName;

    const token = this.authService.currentUserValue?.token;
    if (!token) {
      alert('❌ Missing auth token.');
      return;
    }

    // ✅ Use proxy-relative URL
    const url = new URL('http://localhost:3000/api/v1/email/future-skill-status-email');
    url.searchParams.append('userName', userName);
    url.searchParams.append('skillName', skillName);

    fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    })

      .then(res => res.json())
      .then(res => {
        if (res.success) {
          this.openEmailModal(userName, skillName, res.template);
        } else {
          alert('❌ Failed to load email template.');
        }
      })
      .catch(err => {
        console.error(err);
        alert('❌ Could not load email template.');
      });
  }


  openEmailModal(userName: string, skillName: string, template: string) {
    this.emailData = {
      recipient: `${userName}@example.com`, // or resolve actual email from your user model
      subject: `Status request for ${skillName}`,
      message: template
    };
    this.emailModalOpen = true;
  }

  sendEmail() {
    const fakeUser = {
      id: '',
      username: '',
      email: this.emailData.recipient,
      role: UserRole.LECTURER,
      firstName: '',
      lastName: '',
      employmentType: EmploymentType.EXTERNAL
    };

    this.mailService.sendEmailToUsers(
      [fakeUser],
      this.emailData.subject,
      this.emailData.message
    ).subscribe({
      next: () => {
        alert('✅ Email sent successfully!');
        this.emailModalOpen = false;
      },
      error: () => {
        alert('❌ Failed to send email.');
      }
    });
  }

  addToSkills(skill: any) {
    alert(`Added "${skill.skillName}" to Skills!`);
  }
}

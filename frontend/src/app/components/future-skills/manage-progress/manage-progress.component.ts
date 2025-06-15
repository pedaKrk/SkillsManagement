import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {ManageProgressService} from '../../../core/services/future-skills/manage-progress.service';
import {AuthService, EmailService} from '../../../core';
import {UserRole} from '../../../models/enums/user-roles.enum';
import {EmploymentType} from '../../../models/enums/employment-type.enum';
import {forkJoin} from 'rxjs';


// adjust path as needed


@Component({
  selector: 'app-manage-progress',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './manage-progress.component.html',
  styleUrls: ['./manage-progress.component.scss']
})
export class ManageProgressComponent implements OnInit {
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

  newSkill = {
    lecturer_id: '',
    skill_id: '',
    future_achievable_level: '',
    target_date: ''
  };

  emailModalOpen = false;
  emailData = {
    recipient: '',
    subject: '',
    message: ''
  };

  constructor(private manageProgressService: ManageProgressService, private cdr: ChangeDetectorRef, private mailService: EmailService, private authService: AuthService) {}

    ngOnInit(): void {
      forkJoin({
        lecturers: this.manageProgressService.getAllLecturers(),
        skillOptions: this.manageProgressService.fetchAllSkillNames(),
        skillLevels: this.manageProgressService.fetchAllSkillLevels(),
        futureSkills: this.manageProgressService.getAllFutureSkills()
  }).subscribe(({ lecturers, skillOptions, skillLevels, futureSkills }) => {
      this.lecturers = lecturers;
      this.skillOptions = skillOptions;
      this.skillLevels = skillLevels;

      this.skills = futureSkills.map(skill => ({
        ...skill,
        lecturer_id: lecturers.find(l => l._id === (skill.lecturer_id?._id || skill.lecturer_id)),
        skill_id: skillOptions.find(s => s._id === (skill.skill_id?._id || skill.skill_id)),
        target_date: skill.target_date ? new Date(skill.target_date).toISOString().split('T')[0] : ''
      }));
      this.allSkills = [...this.skills];
      this.cdr.detectChanges();
    });
  }

  getAllFutureSkills() {
    this.manageProgressService.getAllFutureSkills().subscribe({
      next: (data) => {
        this.skills = data.map(skill => ({
          ...skill,
          lecturer_id: this.lecturers.find(l => l._id === (skill.lecturer_id?._id || skill.lecturer_id)),
          skill_id: this.skillOptions.find(s => s._id === skill.skill_id || s._id === skill.skill_id?._id),
          target_date: skill.target_date ? new Date(skill.target_date).toISOString().split('T')[0] : ''
        }));
        this.allSkills = [...this.skills];
      },
      error: (err) => console.error('Error fetching skills:', err)
    });
  }


  // Edit
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

      this.manageProgressService.updateSkill(updatedSkill._id, updatedSkill).subscribe({
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

//delete
  deleteSkill(index: number) {
    const skill = this.skills[index];
    if (confirm('Are you sure you want to delete this skill?')) {
      this.manageProgressService.deleteSkill(skill._id).subscribe({
        next: () => this.skills.splice(index, 1),
        error: err => {
          console.error('Delete failed:', err);
          alert('Delete failed.');
        }
      });
    }
  }
  //create
  addNewSkill() {
    if (this.lecturers.length > 0 && this.skillOptions.length > 0) {
      this.addingNewSkill = true;
    } else {
      // Wait until both are loaded, then allow the row to appear
      const checkDataInterval = setInterval(() => {
        if (this.lecturers.length > 0 && this.skillOptions.length > 0) {
          this.addingNewSkill = true;
          clearInterval(checkDataInterval);
        }
      }, 100); // Check every 100ms
    }
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

      this.manageProgressService.createSkill(payload).subscribe({
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
  //filter
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

//mail
  sendMail(skill: any) {
    console.log('Skill passed to sendMail:', skill);

    const lecturer = skill.lecturer_id;
    const skillInfo = skill.skill_id;

    if (!lecturer || !skillInfo) {
      alert('❌ Missing skill or lecturer data.');
      return;
    }

    const userName = `${lecturer.firstName} ${lecturer.lastName}`;
    const skillName = skillInfo.name;
    const recipientEmail = lecturer.email;  // ✅ actual email from user model

    const token = this.authService.currentUserValue?.token;
    if (!token) {
      alert('❌ Missing auth token.');
      return;
    }

    const url = new URL('http://localhost:3000/api/v1/email/future-skill-status-email');
    url.searchParams.append('userName', userName);
    url.searchParams.append('skillName', skillName);

    fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      }
    })
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          this.emailData = {
            recipient: recipientEmail || `${userName.replace(/\s+/g, '.')}@example.com`, // fallback
            subject: `Status request for ${skillName}`,
            message: res.template
          };
          this.emailModalOpen = true;
        } else {
          alert('❌ Failed to load email template.');
        }
      })
      .catch(err => {
        console.error(err);
        alert('❌ Could not load email template.');
      });
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

import {UserRole} from './enums/user-roles.enum';
import {EmploymentType} from './enums/employment-type.enum';
import { SkillLevel } from './enums/skill-level.enum';
import { Skill as SkillModel } from './skill.model';

// skill model
export interface Skill extends SkillModel {
    level?: SkillLevel;
}

export interface UserSkillEntry {
    skill: Skill;
    addedAt?: string | Date;
    addedBy?: {
        _id?: string;
        firstName?: string;
        lastName?: string;
        email?: string;
    };
    showLevelDropdown?: boolean;
}

export interface User{
    id: string;
    _id?: string;
    username: string;
    role: UserRole;
    title?: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    employmentType: EmploymentType;
    skills?: UserSkillEntry[];
    profileImageUrl?: string;
    token?: string;
}

export interface Comment {
  id?: string;
  _id?: string;
  userId: string;
  authorId: string;
  authorName: string;
  text: string;
  content?: string;
  createdAt: Date;
  time_stamp?: Date;
  author?: {
    _id?: string;
    id?: string;
    username: string;
  };
  replies?: Comment[];
  parentId?: string;
}
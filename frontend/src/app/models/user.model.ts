import {UserRole} from './enums/user-roles.enum';
import {EmploymentType} from './enums/employment-type.enum';
import { Skill } from './skill.model';

export interface UserSkillEntry {
    skill: Skill;
    levelHistory: {
        level: string;
        changedAt: Date;
        changedBy: {
            _id: string;
            firstName: string;
            lastName: string;
        };
    }[];
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
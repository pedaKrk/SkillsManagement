import {UserRole} from './enums/user-roles.enum';
import {EmploymentType} from './enums/employment-type.enum';
import {UserLanguage} from './enums/user-language.enum';
import {CompetenceField} from './enums/competence-field.enum';
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

export interface UserFutureSkillEntry {
    _id: string;
    name: string;
    description?: string;
    category?: string;
    future_achievable_level: string;
    skill_id?: Skill;
    target_date?: Date | string;
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
    languages?: UserLanguage[];
    competenceField?: CompetenceField;
    skills?: UserSkillEntry[];
    futureSkills?: UserFutureSkillEntry[];
    comments?: Comment[];
    profileImageUrl?: string;
    token?: string;
}

export interface CommentAttachment {
  filename: string;
  originalName: string;
  path: string;
  mimetype: string;
  size: number;
  _id?: string;
}

export interface Comment {
  id?: string;
  _id?: string;
  userId: string;
  authorId: string;
  authorName: string;
  text: string;
  content?: string;
  isRichText?: boolean;
  attachments?: CommentAttachment[];
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

import {UserRole} from './enums/user-roles.enum';
import {EmploymentType} from './enums/employment-type.enum';

// skill model
export interface Skill {
    _id: string;
    name: string;
    description?: string;
}

export interface User{
    id: string;
    username: string;
    role: UserRole;
    title?: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    employmentType: EmploymentType;
    skills?: Skill[]; 
    profileImageUrl?: string;
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
}
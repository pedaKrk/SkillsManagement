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
}
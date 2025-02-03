import {UserRole} from './enums/user-roles.enum';
import {EmploymentType} from './enums/employment-type.enum';

export interface User{
    id: string;
    username: string;
    role: UserRole;
    title?: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    employementType: EmploymentType;
}
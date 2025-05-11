import { SkillLevel } from './enums/skill-level.enum';

export interface Skill {
    _id: string;
    name: string;
    description?: string;
    level?: SkillLevel;
    category?: string;
    parent_id?: string | null;
} 
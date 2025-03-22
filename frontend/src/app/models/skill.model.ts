export interface Skill {
    _id: string;
    name: string;
    description?: string;
    level?: number;
    category?: string;
    parent_id?: string | null;
} 
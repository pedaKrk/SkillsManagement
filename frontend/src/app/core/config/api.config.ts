import { environment } from '../../../environments/environment';

export const API_CONFIG = {
  baseUrl: environment.apiUrl,
  endpoints: {
    auth: {
      login: '/auth/login',
      register: '/auth/register',
      logout: '/auth/logout',
      resetPassword: '/auth/reset-password'
    },
    users: {
      profile: '/users/profile',
      all: '/users',
      changePassword: '/users/change-password',
      inactive: '/users/inactive',
      inactiveCount: '/users/inactive/count',
      activate: '/users/:id/activate',
      lecturers: '/users'
    },
    skills: {
      all: '/skills',
      root: '/skills/root',
      names: '/skills/names',
      levels: '/skills/levels'
    },

    futureSkills: {
      all: '/future-skills',
      create: '/future-skills',
      update: (id: string) => `/future-skills/${id}`,
      delete: (id: string) => `/future-skills/${id}`,
      sendEmail: '/future-skills/send-email',
      getTemplate: '/email/future-skill-status-email',
      addToSkills: (id: string) => `/future-skills/${id}/add-to-skills`,
    },
    dashboard: {
      skillsLevelMatrix: '/dashboard/skills-level-matrix',
      skillsByLevel: '/dashboard/skills-by-level',
      skillsPopularity: '/dashboard/skills-popularity',
      fieldsPopularity: '/dashboard/fields-popularity'
    },
    comments: '/comments'
    //  API-Endpoints
  }
};

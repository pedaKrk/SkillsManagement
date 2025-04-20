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
      lecturers: '/users',
      changePassword: '/users/change-password'
    },
    skills: {
      all: '/skills',
      names: '/skills/names',
      levels: '/skills/levels'
    },

    futureSkills: {
      all: '/future-skills',
      create: '/future-skills',
      update: (id: string) => `/future-skills/${id}`,
      delete: (id: string) => `/future-skills/${id}`,
      skillLevels: '/future-skills/skill-levels'
    },
    comments: '/comments'
    //  API-Endpoints
  }
};

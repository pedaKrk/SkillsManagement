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
      changePassword: '/users/change-password'
    },
    skills: {
      all: '/skills'
    },
    comments: '/comments'
    //  API-Endpoints
  }
}; 
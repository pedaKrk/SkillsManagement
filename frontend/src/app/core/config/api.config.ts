import { environment } from '../../../environments/environment';

export const API_CONFIG = {
  baseUrl: environment.apiUrl,
  endpoints: {
    auth: {
      login: '/auth/login',
      register: '/auth/register',
      logout: '/auth/logout'
    },
    users: {
      profile: '/users/profile',
      all: '/users'
    },
    skills: {
      all: '/skills'
    }
    //  API-Endpoints
  }
}; 
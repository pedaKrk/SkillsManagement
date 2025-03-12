export const API_CONFIG = {
  baseUrl: 'http://localhost:3000/api/v1',
  endpoints: {
    auth: {
      login: '/auth/login',
      register: '/auth/register',
      logout: '/auth/logout'
    },
    users: {
      profile: '/users/profile',
      all: '/users'
    }
    //  API-Endpoints
  }
}; 
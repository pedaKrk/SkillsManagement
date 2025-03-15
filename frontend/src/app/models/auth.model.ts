export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  role?: string;
  token?: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: {
    id?: string;
    _id?: string;
    email: string;
    username: string;
    role: string;
  };
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
} 
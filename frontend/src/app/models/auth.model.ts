export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: string;
  token: string;
  mustChangePassword?: boolean;
}

export interface LoginResponse {
  token: string;
  user: {
    _id?: string;
    id?: string;
    email: string;
    username: string;
    role: string;
    mustChangePassword?: boolean;
  };
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
} 
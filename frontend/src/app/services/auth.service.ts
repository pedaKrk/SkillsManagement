import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface User {
  id: string;
  email: string;
  username?: string;
  token?: string;
}

interface LoginResponse {
  message: string;
  token: string;
  user: {
    email: string;
    username: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private apiUrl = 'http://localhost:3000/api/v1';

  constructor(private http: HttpClient) {
    this.currentUserSubject = new BehaviorSubject<User | null>(
      JSON.parse(localStorage.getItem('currentUser') || 'null')
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  // Register a new user
  register(userData: any) {
    return this.http.post(
      `${this.apiUrl}/auth/register`,
      userData
    );
  }

  login(identifier: string, password: string) {
    return this.http.post<LoginResponse>(
      `${this.apiUrl}/auth/login`,
      { identifier, password }
    ).pipe(map(response => {
      const user: User = {
        id: '',
        email: response.user.email,
        username: response.user.username,
        token: response.token
      };
      localStorage.setItem('currentUser', JSON.stringify(user));
      this.currentUserSubject.next(user);
      return user;
    }));
  }

  logout() {
    const currentUser = this.currentUserValue;
    if (currentUser?.token) {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${currentUser.token}`
      });
      
      this.http.post(
        `${this.apiUrl}/auth/logout`,
        {},
        { headers }
      ).subscribe();
    }
    
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }
} 
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private inactiveUsersCountSubject = new Subject<void>();

  inactiveUsersCountChanged$ = this.inactiveUsersCountSubject.asObservable();

  notifyInactiveUsersCountChanged() {
    this.inactiveUsersCountSubject.next();
  }
} 
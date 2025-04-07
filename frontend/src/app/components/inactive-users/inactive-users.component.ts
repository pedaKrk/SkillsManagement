import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../core/services/user/user.service';
import { DialogService, SuccessDialogConfig } from '../../core/services/dialog/dialog.service';
import { NotificationService } from '../../core/services/notification/notification.service';
import { User } from '../../models/user.model';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-inactive-users',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inactive-users.component.html',
  styleUrls: ['./inactive-users.component.scss']
})
export class InactiveUsersComponent implements OnInit {
  inactiveUsers: User[] = [];

  constructor(
    private userService: UserService,
    private dialogService: DialogService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadInactiveUsers();
  }

  loadInactiveUsers(): void {
    this.userService.getInactiveUsers()
      .pipe(
        catchError(error => {
          this.dialogService.showError(
            'Fehler',
            'Beim Laden der inaktiven Benutzer ist ein Fehler aufgetreten.'
          );
          return of([]);
        })
      )
      .subscribe(users => {
        this.inactiveUsers = users;
      });
  }

  activateUser(userId: string): void {
    if (!userId) {
      this.dialogService.showError(
        'Fehler',
        'Benutzer-ID fehlt.'
      );
      return;
    }
    
    this.userService.activateUser(userId)
      .pipe(
        catchError(error => {
          this.dialogService.showError(
            'Fehler',
            'Beim Aktivieren des Benutzers ist ein Fehler aufgetreten.'
          );
          return of(null);
        })
      )
      .subscribe(response => {
        if (response !== null) {
          const successConfig: SuccessDialogConfig = {
            title: 'Erfolg',
            message: 'Der Benutzer wurde erfolgreich aktiviert.'
          };
          this.dialogService.showSuccess(successConfig);
          this.loadInactiveUsers(); // Liste neu laden
          this.notificationService.notifyInactiveUsersCountChanged(); // Benachrichtigung senden
        }
      });
  }
} 
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../core/services/user/user.service';
import { DialogService, SuccessDialogConfig } from '../../core/services/dialog/dialog.service';
import { NotificationService } from '../../core/services/notification/notification.service';
import { User } from '../../models/user.model';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-inactive-users',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './inactive-users.component.html',
  styleUrls: ['./inactive-users.component.scss']
})
export class InactiveUsersComponent implements OnInit {
  inactiveUsers: User[] = [];

  constructor(
    private userService: UserService,
    private dialogService: DialogService,
    private notificationService: NotificationService,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadInactiveUsers();
  }

  loadInactiveUsers(): void {
    this.userService.getInactiveUsers()
      .pipe(
        catchError(error => {
          this.dialogService.showError(
            this.translateService.instant('COMMON.ERROR'),
            this.translateService.instant('USER.LOAD_INACTIVE_USERS_ERROR')
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
        this.translateService.instant('COMMON.ERROR'),
        this.translateService.instant('USER.MISSING_USER_ID')
      );
      return;
    }
    
    this.userService.activateUser(userId)
      .pipe(
        catchError(error => {
          this.dialogService.showError(
            this.translateService.instant('COMMON.ERROR'),
            this.translateService.instant('USER.ACTIVATE_USER_ERROR')
          );
          return of(null);
        })
      )
      .subscribe(response => {
        if (response !== null) {
          const successConfig: SuccessDialogConfig = {
            title: this.translateService.instant('COMMON.SUCCESS'),
            message: this.translateService.instant('USER.USER_ACTIVATED')
          };
          this.dialogService.showSuccess(successConfig);
          this.loadInactiveUsers(); // Liste neu laden
          this.notificationService.notifyInactiveUsersCountChanged(); // Benachrichtigung senden
        }
      });
  }

  rejectUser(userId: string): void {
    if (!userId) {
      this.dialogService.showError(
        this.translateService.instant('COMMON.ERROR'),
        this.translateService.instant('USER.MISSING_USER_ID')
      );
      return;
    }
    
    this.dialogService.showConfirmation({
      title: this.translateService.instant('USER.REJECT_USER_CONFIRMATION'),
      message: this.translateService.instant('USER.REJECT_USER_MESSAGE'),
      confirmText: this.translateService.instant('USER.REJECT'),
      cancelText: this.translateService.instant('COMMON.CANCEL')
    }).subscribe(confirmed => {
      if (confirmed) {
        this.userService.deleteUser(userId)
          .pipe(
            catchError(error => {
              this.dialogService.showError(
                this.translateService.instant('COMMON.ERROR'),
                this.translateService.instant('USER.REJECT_USER_ERROR')
              );
              return of(null);
            })
          )
          .subscribe(response => {
            if (response !== null) {
              const successConfig: SuccessDialogConfig = {
                title: this.translateService.instant('COMMON.SUCCESS'),
                message: this.translateService.instant('USER.USER_REJECTED')
              };
              this.dialogService.showSuccess(successConfig);
              this.loadInactiveUsers(); // Liste neu laden
              this.notificationService.notifyInactiveUsersCountChanged(); // Benachrichtigung senden
            }
          });
      }
    });
  }
} 
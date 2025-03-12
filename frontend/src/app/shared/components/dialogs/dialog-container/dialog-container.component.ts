import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DialogService, DialogState } from '../../../../core/services/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { SuccessDialogComponent } from '../success-dialog/success-dialog.component';
import { FormDialogComponent } from '../form-dialog/form-dialog.component';

@Component({
  selector: 'app-dialog-container',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ConfirmDialogComponent,
    SuccessDialogComponent,
    FormDialogComponent
  ],
  templateUrl: './dialog-container.component.html',
  styleUrls: ['./dialog-container.component.scss']
})
export class DialogContainerComponent implements OnInit, OnDestroy {
  dialogState: DialogState = {
    confirmDialogs: [],
    successDialogs: [],
    formDialogs: [],
    activeDialogId: null
  };
  
  private subscription: Subscription = new Subscription();
  
  constructor(private dialogService: DialogService) {}
  
  ngOnInit(): void {
    this.subscription.add(
      this.dialogService.dialogState$.subscribe(state => {
        this.dialogState = state;
      })
    );
  }
  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  
  get hasActiveDialogs(): boolean {
    return (
      this.dialogState.confirmDialogs.length > 0 ||
      this.dialogState.successDialogs.length > 0 ||
      this.dialogState.formDialogs.length > 0
    );
  }
  
  onBackdropClick(): void {
    const activeDialogId = this.dialogState.activeDialogId;
    if (!activeDialogId) return;
    
    // Finde den aktiven Dialog
    const activeConfirmDialog = this.dialogState.confirmDialogs.find(d => d.id === activeDialogId);
    const activeSuccessDialog = this.dialogState.successDialogs.find(d => d.id === activeDialogId);
    const activeFormDialog = this.dialogState.formDialogs.find(d => d.id === activeDialogId);
    
    // Prüfe, ob der Dialog beim Klick auf den Hintergrund geschlossen werden soll
    if (activeConfirmDialog?.closeOnBackdropClick) {
      this.dialogService.cancelDialog(activeDialogId);
    } else if (activeSuccessDialog?.closeOnBackdropClick) {
      this.dialogService.confirmDialog(activeDialogId);
    } else if (activeFormDialog?.closeOnBackdropClick) {
      this.dialogService.cancelDialog(activeDialogId);
    }
  }
  
  onConfirmDialog(dialogId: string, result: any = true): void {
    this.dialogService.confirmDialog(dialogId, result);
  }
  
  onCancelDialog(dialogId: string): void {
    this.dialogService.cancelDialog(dialogId);
  }
  
  onCloseDialog(dialogId: string): void {
    this.dialogService.confirmDialog(dialogId);
  }
  
  onSubmitFormDialog(dialogId: string, formData: any): void {
    this.dialogService.confirmDialog(dialogId, formData);
  }
} 
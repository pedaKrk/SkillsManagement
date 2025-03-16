import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

// Dialog configurations
export interface DialogConfig {
  id?: string;
  title: string;
  message: string;
  closeOnBackdropClick?: boolean;
}

export interface ConfirmDialogConfig extends DialogConfig {
  confirmText?: string;
  cancelText?: string;
  dangerMode?: boolean;
  data?: any;
}

export interface SuccessDialogConfig extends DialogConfig {
  buttonText?: string;
}

export interface FormDialogConfig extends DialogConfig {
  formFields: any[];
  submitText?: string;
  cancelText?: string;
}

// Dialog status
export interface DialogState {
  confirmDialogs: ConfirmDialogConfig[];
  successDialogs: SuccessDialogConfig[];
  formDialogs: FormDialogConfig[];
  activeDialogId: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  private dialogIdCounter = 0;
  
  // Dialog status as BehaviorSubject
  private dialogStateSubject = new BehaviorSubject<DialogState>({
    confirmDialogs: [],
    successDialogs: [],
    formDialogs: [],
    activeDialogId: null
  });
  
  // Observable for the dialog status
  public dialogState$ = this.dialogStateSubject.asObservable();
  
  // Result subjects for the different dialog types
  private dialogResults: { [key: string]: BehaviorSubject<any> } = {};
  
  constructor() {}
  
  /**
   * Shows a confirmation dialog
   * @param config Configuration for the dialog
   * @returns Observable, that returns true if the user confirms, and false if he cancels
   */
  showConfirmation(config: ConfirmDialogConfig): Observable<boolean> {
    const dialogId = this.generateDialogId();
    const dialogConfig: ConfirmDialogConfig = {
      id: dialogId,
      title: config.title,
      message: config.message,
      confirmText: config.confirmText || 'Bestätigen',
      cancelText: config.cancelText || 'Abbrechen',
      dangerMode: config.dangerMode || false,
      closeOnBackdropClick: config.closeOnBackdropClick !== undefined ? config.closeOnBackdropClick : true,
      data: config.data
    };
    
    // create result subject
    const resultSubject = new BehaviorSubject<boolean>(false);
    this.dialogResults[dialogId] = resultSubject;
    
    // add dialog to state
    const currentState = this.dialogStateSubject.value;
    this.dialogStateSubject.next({
      ...currentState,
      confirmDialogs: [...currentState.confirmDialogs, dialogConfig],
      activeDialogId: dialogId
    });
    
    return resultSubject.asObservable();
  }
  
  /**
   * Shows a success dialog
   * @param config Configuration for the dialog
   * @returns Observable, that returns completed when the dialog is closed
   */
  showSuccess(config: SuccessDialogConfig): Observable<void> {
    const dialogId = this.generateDialogId();
    const dialogConfig: SuccessDialogConfig = {
      id: dialogId,
      title: config.title,
      message: config.message,
      buttonText: config.buttonText || 'OK',
      closeOnBackdropClick: config.closeOnBackdropClick !== undefined ? config.closeOnBackdropClick : true
    };
    
    // create result subject
    const resultSubject = new BehaviorSubject<void>(undefined);
    this.dialogResults[dialogId] = resultSubject;
    
    // add dialog to state
    const currentState = this.dialogStateSubject.value;
    this.dialogStateSubject.next({
      ...currentState,
      successDialogs: [...currentState.successDialogs, dialogConfig],
      activeDialogId: dialogId
    });
    
    return resultSubject.asObservable();
  }
  
  /**
   * Shows an error dialog (uses the same dialog as success, but with different styles)
   * @param config Configuration for the dialog
   * @returns Observable, that returns completed when the dialog is closed
   */
  showError(title: string, message: string): Observable<void> {
    return this.showSuccess({
      title,
      message,
      buttonText: 'OK'
    });
  }

  /**
   * Shows a dialog with a form
   * @param config Configuration for the dialog
   * @returns Observable, that returns the form data if the user confirms
   */
  showFormDialog(config: FormDialogConfig): Observable<any> {
    const dialogId = this.generateDialogId();
    const dialogConfig: FormDialogConfig = {
      id: dialogId,
      title: config.title,
      message: config.message,
      formFields: config.formFields,
      submitText: config.submitText || 'Senden',
      cancelText: config.cancelText || 'Abbrechen',
      closeOnBackdropClick: config.closeOnBackdropClick !== undefined ? config.closeOnBackdropClick : false
    };
    
    // create result subject
    const resultSubject = new BehaviorSubject<any>(null);
    this.dialogResults[dialogId] = resultSubject;
    
    // add dialog to state
    const currentState = this.dialogStateSubject.value;
    this.dialogStateSubject.next({
      ...currentState,
      formDialogs: [...currentState.formDialogs, dialogConfig],
      activeDialogId: dialogId
    });
    
    return resultSubject.asObservable();
  }
  
  /**
   * Confirms a dialog
   * @param dialogId ID of the dialog
   * @param result Result of the dialog
   */
  confirmDialog(dialogId: string, result: any = true): void {
    if (this.dialogResults[dialogId]) {
      this.dialogResults[dialogId].next(result);
      this.dialogResults[dialogId].complete();
      delete this.dialogResults[dialogId];
    }
    
    this.removeDialog(dialogId);
  }
  
  /**
   * Cancels a dialog
   * @param dialogId ID of the dialog
   */
  cancelDialog(dialogId: string): void {
    if (this.dialogResults[dialogId]) {
      this.dialogResults[dialogId].next(false);
      this.dialogResults[dialogId].complete();
      delete this.dialogResults[dialogId];
    }
    
    this.removeDialog(dialogId);
  }
  
  /**
   * Removes a dialog from the state
   * @param dialogId ID of the dialog
   */
  private removeDialog(dialogId: string): void {
    const currentState = this.dialogStateSubject.value;
    
    this.dialogStateSubject.next({
      confirmDialogs: currentState.confirmDialogs.filter(dialog => dialog.id !== dialogId),
      successDialogs: currentState.successDialogs.filter(dialog => dialog.id !== dialogId),
      formDialogs: currentState.formDialogs.filter(dialog => dialog.id !== dialogId),
      activeDialogId: currentState.activeDialogId === dialogId ? null : currentState.activeDialogId
    });
  }
  
  /**
   * Generates a unique dialog ID
   * @returns Unique dialog ID
   */
  private generateDialogId(): string {
    return `dialog-${++this.dialogIdCounter}`;
  }
} 
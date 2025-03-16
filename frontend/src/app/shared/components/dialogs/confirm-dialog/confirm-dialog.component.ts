import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmDialogConfig } from '../../../../core/services/dialog';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss']
})
export class ConfirmDialogComponent {
  @Input() dialog!: ConfirmDialogConfig;
  @Output() confirm = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();
  
  onConfirm(): void {
    this.confirm.emit(true);
  }
  
  onCancel(): void {
    this.cancel.emit();
  }
} 
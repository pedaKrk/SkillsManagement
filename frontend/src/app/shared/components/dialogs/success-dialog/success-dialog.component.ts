import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SuccessDialogConfig } from '../../../../core/services/dialog';

@Component({
  selector: 'app-success-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './success-dialog.component.html',
  styleUrls: ['./success-dialog.component.scss']
})
export class SuccessDialogComponent {
  @Input() dialog!: SuccessDialogConfig;
  @Output() close = new EventEmitter<void>();
  
  onClose(): void {
    this.close.emit();
  }
} 
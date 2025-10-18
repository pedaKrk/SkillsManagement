import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SuccessDialogConfig } from '../../../../core/services/dialog';

@Component({
  selector: 'app-error-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './error-dialog.component.html',
  styleUrls: ['./error-dialog.component.scss']
})
export class ErrorDialogComponent {
  @Input() dialog!: SuccessDialogConfig;
  @Output() close = new EventEmitter<void>();
  
  onClose(): void {
    this.close.emit();
  }
}

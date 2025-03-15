import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormDialogConfig } from '../../../../core/services/dialog';

@Component({
  selector: 'app-form-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form-dialog.component.html',
  styleUrls: ['./form-dialog.component.scss']
})
export class FormDialogComponent implements OnInit {
  @Input() dialog!: FormDialogConfig;
  @Output() submit = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();
  
  formData: { [key: string]: any } = {};
  
  constructor() {}
  
  ngOnInit(): void {
    // Initialisiere formData mit Standardwerten
    this.dialog.formFields.forEach(field => {
      this.formData[field.id] = field.defaultValue || '';
    });
  }
  
  onSubmit(): void {
    if (this.isFormValid()) {
      this.submit.emit(this.formData);
    }
  }
  
  onCancel(): void {
    this.cancel.emit();
  }
  
  isFormValid(): boolean {
    // Einfache Validierung: Prüfe, ob alle erforderlichen Felder ausgefüllt sind
    return this.dialog.formFields
      .filter(field => field.required)
      .every(field => {
        const value = this.formData[field.id];
        return value !== undefined && value !== null && value !== '';
      });
  }
  
  hasRequiredFields(): boolean {
    // Prüft, ob es Pflichtfelder gibt
    return this.dialog.formFields.some(field => field.required);
  }
} 
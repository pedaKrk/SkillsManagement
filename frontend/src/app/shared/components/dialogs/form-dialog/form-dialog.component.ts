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
  
  getHeaderFields(): FormDialogConfig['formFields'] {
    // Gibt die Kopfzeilen-Felder zurück (Empfänger, Betreff)
    return this.dialog.formFields.filter(field => 
      field.type === 'text' || field.type === 'email' || field.id === 'recipients' || field.id === 'subject'
    );
  }
  
  getBodyFields(): FormDialogConfig['formFields'] {
    // Gibt die Nachrichtenfelder zurück (Nachrichtentext)
    return this.dialog.formFields.filter(field => 
      field.type === 'textarea' || field.id === 'message'
    );
  }
  
  getSubjectField(): FormDialogConfig['formFields'] {
    // Gibt nur das Betreff-Feld zurück
    return this.dialog.formFields.filter(field => field.id === 'subject');
  }
  
  getRecipientsField(): FormDialogConfig['formFields'] {
    // Gibt nur das Empfänger-Feld zurück
    return this.dialog.formFields.filter(field => field.id === 'recipients');
  }
  
  getMessageField(): FormDialogConfig['formFields'] {
    // Gibt nur das Nachrichtenfeld zurück
    return this.dialog.formFields.filter(field => field.id === 'message');
  }
} 
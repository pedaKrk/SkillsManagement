import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormDialogConfig } from '../../../../core/services/dialog';

@Component({
  selector: 'app-form-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './form-dialog.component.html',
  styleUrls: ['./form-dialog.component.scss']
})
export class FormDialogComponent implements OnInit {
  @Input() dialog!: FormDialogConfig;
  @Output() submit = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();
  
  formData: { [key: string]: any } = {};
  requiredFieldText: string = '';
  
  constructor(private translateService: TranslateService) {}
  
  ngOnInit(): void {
   
    this.dialog.formFields.forEach(field => {
      this.formData[field.id] = field.defaultValue || '';
    });
      
    this.requiredFieldText = this.translateService.instant('COMMON.REQUIRED_FIELD');
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
   
    return this.dialog.formFields
      .filter(field => field.required)
      .every(field => {
        const value = this.formData[field.id];
        return value !== undefined && value !== null && value !== '';
      });
  }
  
  hasRequiredFields(): boolean {
   
    return this.dialog.formFields.some(field => field.required);
  }
} 
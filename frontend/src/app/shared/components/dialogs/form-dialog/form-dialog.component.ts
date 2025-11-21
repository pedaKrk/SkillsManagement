import { Component, Input, Output, EventEmitter, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormDialogConfig } from '../../../../core/services/dialog';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

@Component({
  selector: 'app-form-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './form-dialog.component.html',
  styleUrls: ['./form-dialog.component.scss']
})
export class FormDialogComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() dialog!: FormDialogConfig;
  @Output() submit = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();
  
  formData: { [key: string]: any } = {};
  requiredFieldText: string = '';
  quillEditors: { [key: string]: Quill } = {};
  fileInputs: { [key: string]: FileList | null } = {};
  
  constructor(private translateService: TranslateService) {}
  
  ngOnInit(): void {
    this.dialog.formFields.forEach(field => {
      if (field.type === 'richtext') {
        this.formData[field.id] = field.defaultValue || '';
      } else if (field.type === 'file') {
        this.fileInputs[field.id] = null;
      } else {
        this.formData[field.id] = field.defaultValue || '';
      }
    });
      
    this.requiredFieldText = this.translateService.instant('COMMON.REQUIRED_FIELD');
  }
  
  ngAfterViewInit(): void {
    // Initialize Quill editors for richtext fields
    setTimeout(() => {
      this.dialog.formFields.forEach(field => {
        if (field.type === 'richtext') {
          const editorElement = document.getElementById(`quill-editor-${field.id}`);
          if (editorElement && !this.quillEditors[field.id]) {
            const quill = new Quill(editorElement, {
              theme: 'snow',
              modules: {
                toolbar: [
                  ['bold', 'italic', 'underline', 'strike'],
                  ['blockquote', 'code-block'],
                  [{ 'header': 1 }, { 'header': 2 }],
                  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                  [{ 'script': 'sub'}, { 'script': 'super' }],
                  [{ 'indent': '-1'}, { 'indent': '+1' }],
                  [{ 'direction': 'rtl' }],
                  [{ 'size': ['small', false, 'large', 'huge'] }],
                  [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                  [{ 'color': [] }, { 'background': [] }],
                  [{ 'font': [] }],
                  [{ 'align': [] }],
                  ['clean'],
                  ['link', 'image']
                ]
              }
            });
            
            // Set initial content
            if (this.formData[field.id]) {
              quill.root.innerHTML = this.formData[field.id];
            }
            
            // Update formData when content changes
            quill.on('text-change', () => {
              this.formData[field.id] = quill.root.innerHTML;
            });
            
            this.quillEditors[field.id] = quill;
          }
        }
      });
    }, 100);
  }
  
  ngOnDestroy(): void {
    // Clean up Quill editors
    Object.values(this.quillEditors).forEach(editor => {
      if (editor) {
        editor = null as any;
      }
    });
  }
  
  onFileChange(fieldId: string, event: any): void {
    const files = event.target.files;
    this.fileInputs[fieldId] = files;
    // Store files in formData for submission
    this.formData[fieldId] = files;
  }
  
  getFileNames(fieldId: string): string {
    const files = this.fileInputs[fieldId];
    if (!files || files.length === 0) return '';
    return Array.from(files).map((file: File) => file.name).join(', ');
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
        if (field.type === 'file') {
          const files = this.fileInputs[field.id];
          return files && files.length > 0;
        } else {
          const value = this.formData[field.id];
          // For richtext, check if there's actual content (not just empty HTML tags)
          if (field.type === 'richtext' && value) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = value;
            return tempDiv.textContent?.trim() !== '' || tempDiv.innerText?.trim() !== '';
          }
          return value !== undefined && value !== null && value !== '';
        }
      });
  }
  
  hasRequiredFields(): boolean {
   
    return this.dialog.formFields.some(field => field.required);
  }
} 
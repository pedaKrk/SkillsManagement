import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user/user.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { DialogService } from '../../core/services/dialog/dialog.service';
import { User } from '../../models/user.model';
import { UserRole } from '../../models/enums/user-roles.enum';
import { EmploymentType } from '../../models/enums/employment-type.enum';
import { environment } from '../../../environments/environment';
import imageCompression from 'browser-image-compression';

@Component({
  selector: 'app-user-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule
  ],
  templateUrl: './user-edit.component.html',
  styleUrl: './user-edit.component.scss'
})
export class UserEditComponent implements OnInit {
  userId: string = '';
  user: User | null = null;
  userForm!: FormGroup;
  isLoading: boolean = false;
  error: string | null = null;
  isAdmin: boolean = false;
  
  // for the dropdown lists
  userRoles = Object.values(UserRole);
  employmentTypes = Object.values(EmploymentType);
  
  // for the profile image editing
  previewImageUrl: string | null = null;
  selectedImageFile: File | null = null;
  imageError: string | null = null;
  removeImageFlag: boolean = false;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private dialogService: DialogService
  ) {}
  
  ngOnInit(): void {
    // check if user is logged in
    const currentUser = this.authService.currentUserValue;
    if (!currentUser || !currentUser.token) {
      console.warn('User is not logged in or token is missing');
      this.error = 'Sie müssen eingeloggt sein, um diese Seite anzuzeigen.';
      return;
    }
    
    // check permissions
    this.checkPermissions();
    
    // get user ID from URL
    this.route.params.subscribe(params => {
      this.userId = params['id'];
      if (this.userId) {
        this.loadUserDetails();
      }
    });
    
    // initialize form
    this.initForm();
  }
  
  /**
   * checks the permissions of the current user
   */
  checkPermissions(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      // check the role regardless of case
      const role = currentUser.role?.toLowerCase() || '';
      this.isAdmin = role === 'admin';
      
      if (!this.isAdmin) {
        this.error = 'Sie haben keine Berechtigung, Benutzerprofile zu bearbeiten.';
        this.router.navigate(['/users', this.userId]);
      }
    } else {
      this.isAdmin = false;
      this.error = 'Sie müssen als Administrator angemeldet sein, um Benutzerprofile zu bearbeiten.';
    }
  }
  
  /**
   * initializes the form
   */
  initForm(): void {
    this.userForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      title: [''],
      phoneNumber: [''],
      role: ['', [Validators.required]],
      employmentType: ['', [Validators.required]]
    });
  }
  
  /**
   * loads the user details from the server
   */
  loadUserDetails(): void {
    this.isLoading = true;
    this.error = null;
    
    this.userService.getUserById(this.userId).subscribe({
      next: (user) => {
        this.user = user;
        this.populateForm();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Fehler beim Laden der Benutzerdetails:', error);
        
        if (error.status === 500) {
          this.error = 'Ein Serverfehler ist aufgetreten. Das Backend konnte den Benutzer nicht laden. Bitte kontaktieren Sie den Administrator.';
        } else if (error.status === 404) {
          this.error = 'Der angeforderte Benutzer wurde nicht gefunden.';
        } else if (error.status === 401) {
          this.error = 'Sie sind nicht berechtigt, diese Informationen anzuzeigen. Bitte melden Sie sich an.';
        } else {
          this.error = 'Fehler beim Laden der Benutzerdetails. Bitte versuchen Sie es später erneut.';
        }
        
        this.isLoading = false;
      }
    });
  }
  
  /**
   * fills the form with the user data
   */
  populateForm(): void {
    if (!this.user) return;
    
    this.userForm.patchValue({
      username: this.user.username,
      firstName: this.user.firstName,
      lastName: this.user.lastName,
      email: this.user.email,
      title: this.user.title || '',
      phoneNumber: this.user.phoneNumber || '',
      role: this.user.role,
      employmentType: this.user.employmentType
    });
  }
  
  /**
   * returns the initials of the user (for the avatar)
   */
  getUserInitials(): string {
    if (!this.user) return '';
    return (this.user.firstName.charAt(0) + this.user.lastName.charAt(0)).toUpperCase();
  }
  
  /**
   * is called when an image is selected
   * @param event the event object of the file input
   */
  async onImageSelected(event: Event): Promise<void> {
    this.imageError = null;
    const input = event.target as HTMLInputElement;
    
    if (!input.files || input.files.length === 0) {
      return;
    }
    
    const file = input.files[0];
    
    // check if it is an image
    if (!file.type.match(/image\/(jpeg|jpg|png|gif|webp)/)) {
      this.imageError = 'Nur Bilddateien (JPEG, PNG, GIF, WebP) sind erlaubt.';
      return;
    }
    
    try {
      this.isLoading = true;
      
      // compression options
      const options = {
        maxSizeMB: 1,             // maximum size after compression: 1 MB
        maxWidthOrHeight: 1920,   // maximum width or height: 1920 pixels
        useWebWorker: true,       // use web worker for better performance
        initialQuality: 0.8       // initial quality: 80%
      };
      
      // compress the image
      console.log('Original image size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
      const compressedFile = await imageCompression(file, options);
      console.log('Compressed image size:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB');
      
      // compressed image for the preview
      this.selectedImageFile = compressedFile;
      this.removeImageFlag = false;
      
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          this.previewImageUrl = e.target.result as string;
        }
        this.isLoading = false;
      };
      reader.onerror = () => {
        this.imageError = 'Fehler beim Lesen der Bilddatei.';
        this.isLoading = false;
      };
      reader.readAsDataURL(compressedFile);
      
    } catch (error) {
      console.error('Fehler bei der Bildkomprimierung:', error);
      this.imageError = 'Fehler bei der Verarbeitung des Bildes. Bitte versuchen Sie es mit einem anderen Bild.';
      this.isLoading = false;
    }
  }
  
  /**
   * removes the profile image
   */
  markProfileImageForRemoval(): void {
    this.previewImageUrl = null;
    this.selectedImageFile = null;
    this.removeImageFlag = true;
  }
  
  /**
   * saves the changes to the user profile
   */
  saveChanges(): void {
    if (this.userForm.invalid) {
      // mark all fields as touched to display validation errors
      Object.keys(this.userForm.controls).forEach(key => {
        const control = this.userForm.get(key);
        control?.markAsTouched();
      });
      return;
    }
    
    this.isLoading = true;
    
    // get the user data from the form
    const updatedUserData = {
      ...this.user,
      ...this.userForm.value
    };
    
    // process profile image changes
    if (this.selectedImageFile) {
      // first update the user data, then upload the profile image
      this.updateUser(updatedUserData, true);
    } else if (this.removeImageFlag) {
      // remove the profile image and update the user data
      this.removeProfileImage(updatedUserData);
    } else {
      // update the user data only
      this.updateUser(updatedUserData);
    }
  }
  
  /**
   * uploads a new profile image
   */
  private uploadProfileImage(): void {
    if (!this.selectedImageFile || !this.userId) {
      return;
    }
    
    this.userService.uploadProfileImage(this.userId, this.selectedImageFile).subscribe({
      next: (updatedUser) => {
        this.isLoading = false;
        this.dialogService.showSuccess({
          title: 'Erfolg',
          message: 'Profilbild wurde erfolgreich aktualisiert.',
          buttonText: 'OK'
        });
        
        // Zurück zur Benutzerdetailseite navigieren
        this.router.navigate(['/users', this.userId]);
      },
      error: (error) => {
        this.handleError('Das Profilbild konnte nicht hochgeladen werden. Bitte versuchen Sie es später erneut.');
      }
    });
  }
  
  /**
   * removes the profile image
   * @param userData the updated user data
   */
  private removeProfileImage(userData: any): void {
    this.userService.removeProfileImage(this.userId).subscribe({
      next: (updatedUser) => {
        // after removing the profile image, update the rest of the user data
        this.updateUser(userData);
      },
      error: (error) => {
        this.handleError('Das Profilbild konnte nicht entfernt werden. Bitte versuchen Sie es später erneut.');
      }
    });
  }
  
  /**
   * updates the user data on the server
   * @param userData the updated user data
   * @param uploadImageAfter whether to upload a profile image after the update
   */
  private updateUser(userData: any, uploadImageAfter: boolean = false): void {
    this.userService.updateUser(this.userId, userData).subscribe({
      next: (response) => {
        if (uploadImageAfter) {
          // after updating the user data, upload the profile image
          this.uploadProfileImage();
        } else {
          this.isLoading = false;
          this.dialogService.showSuccess({
            title: 'Erfolg',
            message: 'Benutzerprofil wurde erfolgreich aktualisiert.',
            buttonText: 'OK'
          });
          
          // navigate back to the user detail page
          this.router.navigate(['/users', this.userId]);
        }
      },
      error: (error) => {
        this.handleError('Das Benutzerprofil konnte nicht aktualisiert werden. Bitte versuchen Sie es später erneut.');
      }
    });
  }
  
  /**
   * handles errors during processing
   * @param message the error message
   */
  private handleError(message: string): void {
    console.error('Error updating the user profile:', message);
    this.isLoading = false;
    
    this.dialogService.showError(
      'Fehler',
      message
    );
  }
  
  /**
   * cancels the processing and navigates back to the user detail page
   */
  cancel(): void {
    this.router.navigate(['/users', this.userId]);
  }
  
  /**
   * checks if a form field is invalid and touched
   * @param controlName the name of the form field
   * @returns true if the field is invalid and touched
   */
  isFieldInvalid(controlName: string): boolean {
    const control = this.userForm.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }
  
  /**
   * Gibt die vollständige URL für ein Profilbild zurück
   * @param profileImageUrl Die relative URL des Profilbilds
   * @returns Die vollständige URL des Profilbilds
   */
  getProfileImageUrl(profileImageUrl: string): string {
    if (!profileImageUrl) return '';
    
    // Wenn die URL bereits absolut ist (beginnt mit http oder https), verwende sie direkt
    if (profileImageUrl.startsWith('http')) {
      return profileImageUrl;
    }
    
    // Wenn die URL mit einem Schrägstrich beginnt, entferne ihn
    const cleanUrl = profileImageUrl.startsWith('/') ? profileImageUrl.substring(1) : profileImageUrl;
    
    // Erstelle die vollständige URL
    // Verwende die Basis-URL ohne den API-Pfad
    const baseUrl = environment.apiUrl.split('/api/v1')[0];
    
    // Verwende eine direkte URL zum Backend-Server
    const fullUrl = `${baseUrl}/${cleanUrl}`;
    console.log('Profilbild-URL:', fullUrl);
    
    // Verwende eine statische URL ohne Timestamp, um Angular-Fehler zu vermeiden
    return fullUrl;
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user/user.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { DialogService } from '../../core/services/dialog/dialog.service';
import { User } from '../../models/user.model';
import { UserRole } from '../../models/enums/user-roles.enum';
import { EmploymentType } from '../../models/enums/employment-type.enum';
import { environment } from '../../../environments/environment';
import imageCompression from 'browser-image-compression';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-user-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule
  ],
  templateUrl: './user-edit.component.html',
  styleUrls: ['./user-edit.component.scss']
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
  ) {
    this.initForm();
  }
  
  ngOnInit(): void {
    // check if user is logged in
    const currentUser = this.authService.currentUserValue;
    if (!currentUser || !currentUser.token) {
      console.warn('User is not logged in or token is missing');
      this.error = 'Sie müssen eingeloggt sein, um diese Seite anzuzeigen.';
      return;
    }
    
    console.log('NgOnInit: CurrentUser:', currentUser);
    
    // get user ID from URL
    this.route.params.subscribe(params => {
      this.userId = params['id'];
      console.log('User ID from URL params:', this.userId);
      
      // Fallback: Use the ID of the logged in user, if no ID in the URL
      if (!this.userId && currentUser) {
        this.userId = currentUser.id;
        console.log('Using current user ID as fallback:', this.userId);
      }
      
      if (this.userId) {
        // check permissions only when the ID is set
        this.checkPermissions();
        this.loadUserDetails();
      } else {
        this.error = 'No user ID available';
      }
    });
  }
  
  /**
   * checks the permissions of the current user
   */
  checkPermissions(): void {
    console.log('Checking permissions...');
    const currentUser = this.authService.currentUserValue;
    
    if (currentUser) {
      console.log('Current user:', currentUser);
      console.log('Current userId:', this.userId);
      
      // check if user is admin or competence leader
      const userRole = currentUser.role.toLowerCase();
      this.isAdmin = userRole === UserRole.ADMIN.toLowerCase() || 
                     userRole === UserRole.COMPETENCE_LEADER.toLowerCase();
      
      console.log('Is admin or competence leader:', this.isAdmin);
      
      const isOwnProfile = this.authService.isOwnProfile(this.userId);
      console.log('Is own profile:', isOwnProfile);
      
      if (!this.isAdmin && !isOwnProfile) {
        console.warn('No permission to edit this profile!');
        this.error = 'Sie haben keine Berechtigung, dieses Benutzerprofil zu bearbeiten.';
        this.router.navigate(['/users', this.userId]);
      } else {
        console.log('Permission granted to edit profile');
        
        // If not admin, disable role and employmentType fields
        if (!this.isAdmin) {
          this.userForm.get('role')?.disable();
          this.userForm.get('employmentType')?.disable();
        }
      }
    } else {
      this.isAdmin = false;
      this.error = 'Sie müssen angemeldet sein, um Benutzerprofile zu bearbeiten.';
    }
  }
  
  /**
   * initializes the form
   */
  initForm(): void {
    // Basic form controls that are always required
    const formControls: { [key: string]: any[] } = {
      username: ['', [Validators.required]],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      title: [''],
      phoneNumber: ['']
    };

    // Add role and employmentType only for admins
    if (this.isAdmin) {
      formControls['role'] = ['', [Validators.required]];
      formControls['employmentType'] = ['', [Validators.required]];
    }

    this.userForm = this.formBuilder.group(formControls);
  }
  
  /**
   * loads the user details from the server
   */
  loadUserDetails(): void {
    this.isLoading = true;
    this.error = null;
    
    console.log('Versuche Benutzerdetails zu laden für ID:', this.userId);
    console.log('Aktueller Benutzer:', this.authService.currentUserValue);
    
    // If it is the own profile, then load the own profile directly
    const currentUser = this.authService.currentUserValue;
    const isOwnProfile = currentUser && currentUser.id === this.userId;
    
    if (isOwnProfile) {
      console.log('Eigenes Profil wird geladen');
      this.userService.getUserProfile().subscribe({
        next: (user) => {
          console.log('Eigenes Benutzerprofil erfolgreich geladen:', user);
          this.user = user;
          this.populateForm();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Fehler beim Laden des eigenen Benutzerprofils:', error);
          this.handleUserLoadError(error);
        }
      });
    } else {
      console.log('Fremdes Profil wird geladen');
      this.userService.getUserById(this.userId).subscribe({
        next: (user) => {
          console.log('Benutzerprofil erfolgreich geladen:', user);
          this.user = user;
          this.populateForm();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Fehler beim Laden der Benutzerdetails:', error);
          this.handleUserLoadError(error);
        }
      });
    }
  }
  
  /**
   * Handles errors when loading user data
   */
  private handleUserLoadError(error: any): void {
    if (error.status === 500) {
      this.error = 'Ein Serverfehler ist aufgetreten. Das Backend konnte den Benutzer nicht laden. Bitte kontaktieren Sie den Administrator.';
    } else if (error.status === 404) {
      this.error = 'Der angeforderte Benutzer wurde nicht gefunden.';
    } else if (error.status === 401) {
      this.error = 'Sie sind nicht berechtigt, diese Informationen anzuzeigen. Bitte melden Sie sich an.';
    } else if (error.status === 403) {
      this.error = 'Sie haben keine Berechtigung, dieses Benutzerprofil zu bearbeiten.';
    } else {
      this.error = 'Fehler beim Laden der Benutzerdetails. Bitte versuchen Sie es später erneut.';
    }
    
    this.isLoading = false;
  }
  
  /**
   * fills the form with the user data
   */
  populateForm(): void {
    if (!this.user) return;
    
    const formData: {
      username: string;
      firstName: string;
      lastName: string;
      email: string;
      title: string;
      phoneNumber: string;
      role?: string;
      employmentType?: string;
    } = {
      username: this.user.username,
      firstName: this.user.firstName,
      lastName: this.user.lastName,
      email: this.user.email,
      title: this.user.title || '',
      phoneNumber: this.user.phoneNumber || ''
    };

    // Add role and employmentType only for admins
    if (this.isAdmin) {
      formData.role = this.user.role;
      formData.employmentType = this.user.employmentType;
    }

    this.userForm.patchValue(formData);
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
    this.dialogService.showConfirmation({
      title: 'Profilbild entfernen',
      message: 'Möchten Sie das Profilbild wirklich entfernen?',
      confirmText: 'Ja, entfernen',
      cancelText: 'Abbrechen',
      dangerMode: true
    }).subscribe(confirmed => {
      if (confirmed) {
        this.isLoading = true;
        this.previewImageUrl = null;
        this.selectedImageFile = null;
        this.removeImageFlag = true;
        
        // directly remove the image and save the data
        const updatedUserData = {
          ...this.user,
          ...this.userForm.value
        };
        this.removeProfileImage(updatedUserData);
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
        // directly remove the image and update the user state
        if (this.user) {
          const updatedUserData = {
            ...this.user,
            profileImageUrl: undefined
          };
          this.user = updatedUserData as User;
        }
        
        // update the remaining user data
        this.userService.updateUser(this.userId, userData).subscribe({
          next: (response) => {
            this.isLoading = false;
            
            // update the user state with the server response
            if (this.user) {
              const finalUserData = {
                ...this.user,
                ...response,
                profileImageUrl: undefined
              };
              this.user = finalUserData as User;
            }
            
            this.dialogService.showSuccess({
              title: 'Erfolg',
              message: 'Profilbild wurde erfolgreich entfernt.',
              buttonText: 'OK'
            });
            
            // reset all image-related flags
            this.previewImageUrl = null;
            this.selectedImageFile = null;
            this.removeImageFlag = false;
          },
          error: (error) => {
            this.handleError('Die Benutzerdaten konnten nicht aktualisiert werden. Bitte versuchen Sie es später erneut.');
          }
        });
      },
      error: (error) => {
        this.handleError('Das Profilbild konnte nicht entfernt werden. Bitte versuchen Sie es später erneut.');
      }
    });
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
    const formData: { [key: string]: any } = this.userForm.value;
    
    // If not admin, keep the existing role and employmentType
    if (!this.isAdmin && this.user) {
      formData['role'] = this.user.role;
      formData['employmentType'] = this.user.employmentType;
    }
    
    // process profile image changes
    if (this.selectedImageFile) {
      // first update the user data, then upload the profile image
      this.updateUser(formData, true);
    } else if (this.removeImageFlag) {
      // remove the profile image and update the user data
      this.removeProfileImage(formData);
    } else {
      // update the user data only
      this.updateUser(formData);
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
        
        // navigate back to the user detail page
        this.router.navigate(['/users', this.userId]);
      },
      error: (error) => {
        this.handleError('Das Profilbild konnte nicht hochgeladen werden. Bitte versuchen Sie es später erneut.');
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
   * returns the full URL for a profile image
   * @param profileImageUrl the relative URL of the profile image
   * @returns the full URL of the profile image
   */
  getProfileImageUrl(profileImageUrl: string): string {
    if (!profileImageUrl) return '';
    
    // if the URL is already absolute (starts with http or https), use it directly
    if (profileImageUrl.startsWith('http')) {
      return profileImageUrl;
    }
    
    // if the URL starts with a slash, remove it
    const cleanUrl = profileImageUrl.startsWith('/') ? profileImageUrl.substring(1) : profileImageUrl;
    
    // create the full URL
    // use the base URL without the API path
    const baseUrl = environment.apiUrl.split('/api/v1')[0];
    
    // use a direct URL to the backend server
    const fullUrl = `${baseUrl}/${cleanUrl}`;
    console.log('Profilbild-URL:', fullUrl);
    
    // use a static URL without a timestamp to avoid Angular errors
    return fullUrl;
  }

  /**
   * Navigate back to the previous page
   */
  goBack(): void {
    this.router.navigate(['/users']);
  }
}

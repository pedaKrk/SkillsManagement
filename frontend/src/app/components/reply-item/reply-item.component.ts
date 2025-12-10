import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Comment } from '../../models/user.model';
import { AuthService } from '../../core/services/auth/auth.service';
import { CommentService } from '../../core/services/comment/comment.service';
import { DialogService } from '../../core/services/dialog/dialog.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-reply-item',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule
  ],
  templateUrl: './reply-item.component.html',
  styleUrl: './reply-item.component.scss'
})
export class ReplyItemComponent {
  @Input() reply: Comment | null = null;
  @Input() parentCommentId: string = '';
  @Input() userId: string = '';
  @Input() isAdmin: boolean = false;
  @Input() isEditing: boolean = false;
  @Input() isOtherEditing: boolean = false;
  @Input() maxTextLength: number = 150;
  @Input() isExpanded: boolean = false;

  @Output() replyUpdated = new EventEmitter<Comment>();
  @Output() replyDeleted = new EventEmitter<string>();
  @Output() editStarted = new EventEmitter<Comment>();
  @Output() editCancelled = new EventEmitter<void>();
  @Output() expansionToggled = new EventEmitter<string>();

  editing: boolean = false;
  editText: string = '';
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private commentService: CommentService,
    private dialogService: DialogService,
    private translateService: TranslateService,
    private cdr: ChangeDetectorRef
  ) {}

  /**
   * Checks if the current user is the author of the reply
   */
  isReplyAuthor(): boolean {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser || !this.reply?.authorId) {
      return false;
    }
    return currentUser.id === this.reply.authorId;
  }

  /**
   * Checks if the current user can delete the reply (author or admin)
   */
  canDeleteReply(): boolean {
    return this.isReplyAuthor() || this.isAdmin;
  }

  /**
   * Checks if text is too long
   */
  isTextTooLong(text: string | undefined): boolean {
    return !!text && text.length > this.maxTextLength;
  }

  /**
   * Gets display text (truncated if needed)
   */
  getDisplayText(text: string | undefined, isExpanded: boolean): string {
    if (!text) return '';
    if (isExpanded || text.length <= this.maxTextLength) return text;
    return text.substring(0, this.maxTextLength) + '...';
  }

  /**
   * Formats date for display
   */
  formatDate(date: Date): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Starts editing the reply
   */
  startEdit(): void {
    if (this.isOtherEditing) return;
    this.editing = true;
    this.editText = this.reply?.text || '';
    this.editStarted.emit(this.reply!);
  }

  /**
   * Cancels editing
   */
  cancelEdit(): void {
    this.editing = false;
    this.editText = '';
    this.editCancelled.emit();
  }

  /**
   * Saves the edited reply
   */
  saveEdit(): void {
    if (!this.reply || !this.editText.trim()) return;

    this.isLoading = true;
    const replyId = this.reply.id || this.reply._id || '';
    let parentCommentId = this.parentCommentId || this.reply.parentId || '';

    // Find parent comment ID if not provided
    if (!parentCommentId) {
      // This should be handled by parent component
      this.isLoading = false;
      return;
    }

    this.commentService.updateReply(this.userId, parentCommentId, replyId, this.editText).subscribe({
      next: (updatedReply) => {
        const updated: Comment = {
          ...this.reply!,
          text: updatedReply.content || this.editText
        };
        this.replyUpdated.emit(updated);
        this.editing = false;
        this.editText = '';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error updating reply:', error);
        this.translateService.get(['PROFILE.REPLY_UPDATE_ERROR', 'PROFILE.REPLY_EDIT_PERMISSION_ERROR', 'COMMON.ERROR']).subscribe(translations => {
          let errorMessage = translations['PROFILE.REPLY_UPDATE_ERROR'] || 'The reply could not be updated.';
          if (error.status === 403) {
            errorMessage = translations['PROFILE.REPLY_EDIT_PERMISSION_ERROR'] || 'You do not have permission to edit this reply.';
          }
          this.dialogService.showError(
            translations['COMMON.ERROR'] || 'Error',
            errorMessage
          );
        });
        this.isLoading = false;
      }
    });
  }

  /**
   * Deletes the reply
   */
  deleteReply(): void {
    if (!this.reply) return;

    const replyId = this.reply.id || this.reply._id || '';
    let parentCommentId = this.parentCommentId || this.reply.parentId || '';

    if (!replyId || !parentCommentId) {
      this.translateService.get(['COMMON.ERROR', 'PROFILE.COMMENT_ID_NOT_FOUND']).subscribe(translations => {
        this.dialogService.showError(
          translations['COMMON.ERROR'] || 'Error',
          translations['PROFILE.COMMENT_ID_NOT_FOUND'] || 'Reply ID not found.'
        );
      });
      return;
    }

    this.translateService.get(['PROFILE.REPLY_DELETE_CONFIRMATION', 'PROFILE.REPLY_DELETE_MESSAGE', 'PROFILE.REPLY_DELETE_CONFIRM', 'COMMON.CANCEL']).subscribe(translations => {
      this.dialogService.showConfirmation({
        title: translations['PROFILE.REPLY_DELETE_CONFIRMATION'] || 'Delete Reply',
        message: translations['PROFILE.REPLY_DELETE_MESSAGE'] || 'Do you really want to delete this reply? This action cannot be undone.',
        confirmText: translations['PROFILE.REPLY_DELETE_CONFIRM'] || 'Yes, delete',
        cancelText: translations['COMMON.CANCEL'] || 'Cancel',
        dangerMode: true
      }).subscribe(confirmed => {
        if (confirmed) {
          this.isLoading = true;

          this.commentService.deleteReply(this.userId, parentCommentId, replyId).subscribe({
            next: () => {
              this.translateService.get(['COMMON.SUCCESS', 'PROFILE.REPLY_DELETED_SUCCESS', 'COMMON.OK']).subscribe(successTranslations => {
                this.dialogService.showSuccess({
                  title: successTranslations['COMMON.SUCCESS'] || 'Success',
                  message: successTranslations['PROFILE.REPLY_DELETED_SUCCESS'] || 'Reply was successfully deleted.',
                  buttonText: successTranslations['COMMON.OK'] || 'OK'
                });
              });

              this.replyDeleted.emit(replyId);
              this.isLoading = false;
              this.cdr.detectChanges();
            },
            error: (error) => {
              console.error('Error deleting reply:', error);

              // If reply was already deleted (404), just emit deletion event
              if (error.status === 404) {
                this.replyDeleted.emit(replyId);
                this.isLoading = false;
                this.cdr.detectChanges();
                return;
              }

              this.translateService.get(['PROFILE.REPLY_DELETE_ERROR', 'PROFILE.REPLY_DELETE_PERMISSION_ERROR', 'COMMON.ERROR']).subscribe(errorTranslations => {
                let errorMessage = errorTranslations['PROFILE.REPLY_DELETE_ERROR'] || 'The reply could not be deleted.';
                if (error.status === 403) {
                  errorMessage = errorTranslations['PROFILE.REPLY_DELETE_PERMISSION_ERROR'] || 'You do not have permission to delete this reply.';
                }
                this.dialogService.showError(
                  errorTranslations['COMMON.ERROR'] || 'Error',
                  errorMessage
                );
              });
              this.isLoading = false;
            }
          });
        }
      });
    });
  }

  /**
   * Toggles text expansion
   */
  toggleExpansion(): void {
    if (this.reply) {
      const replyId = this.reply.id || this.reply._id;
      this.expansionToggled.emit(replyId);
    }
  }
}


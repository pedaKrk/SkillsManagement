import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Comment } from '../../models/user.model';
import { AuthService } from '../../core/services/auth/auth.service';
import { CommentService } from '../../core/services/comment/comment.service';
import { DialogService } from '../../core/services/dialog/dialog.service';
import { API_CONFIG } from '../../core/config/api.config';
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
    private sanitizer: DomSanitizer,
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
   * Checks if text is too long (for plain text or HTML)
   */
  isTextTooLong(text: string | undefined): boolean {
    if (!text) return false;
    // For HTML, strip tags to check actual text length
    const plainText = this.stripHtmlTags(text);
    return plainText.length > this.maxTextLength;
  }

  /**
   * Strips HTML tags to get plain text
   */
  private stripHtmlTags(html: string): string {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  /**
   * Gets display text (truncated if needed)
   * Returns SafeHtml for rich text, plain string for regular text
   */
  getDisplayText(text: string | undefined, isExpanded: boolean, isRichText: boolean = false): SafeHtml | string {
    if (!text) return '';
    
    if (isRichText) {
      // For rich text, return HTML
      if (isExpanded) {
        return this.sanitizer.sanitize(1, text) || '';
      } else {
        // Truncate HTML content
        const plainText = this.stripHtmlTags(text);
        if (plainText.length <= this.maxTextLength) {
          return this.sanitizer.sanitize(1, text) || '';
        }
        // Truncate and add ellipsis
        const truncatedHtml = this.truncateHtml(text, this.maxTextLength);
        return this.sanitizer.sanitize(1, truncatedHtml + '...') || '';
      }
    } else {
      // Plain text
      if (isExpanded || text.length <= this.maxTextLength) return text;
      return text.substring(0, this.maxTextLength) + '...';
    }
  }

  /**
   * Truncates HTML while preserving structure
   */
  private truncateHtml(html: string, maxLength: number): string {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    const text = tmp.textContent || tmp.innerText || '';
    
    if (text.length <= maxLength) {
      return html;
    }
    
    // Simple truncation
    let truncated = '';
    let currentLength = 0;
    const walker = document.createTreeWalker(tmp, NodeFilter.SHOW_TEXT, null);
    let node;
    
    while (node = walker.nextNode()) {
      const nodeText = node.textContent || '';
      if (currentLength + nodeText.length <= maxLength) {
        truncated += nodeText;
        currentLength += nodeText.length;
      } else {
        truncated += nodeText.substring(0, maxLength - currentLength);
        break;
      }
    }
    
    return truncated;
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
   * Gets the download URL for an attachment
   */
  getAttachmentUrl(attachment: any): string {
    if (!attachment || !attachment.path) return '';
    // Extract base URL from API config (remove /api/v1)
    const apiBaseUrl = API_CONFIG.baseUrl.replace('/api/v1', '');
    return `${apiBaseUrl}/${attachment.path}`;
  }

  /**
   * Gets file icon class based on mimetype
   */
  getFileIconClass(mimetype: string): string {
    if (!mimetype) return 'fa-file';
    
    if (mimetype.startsWith('image/')) return 'fa-file-image';
    if (mimetype.includes('pdf')) return 'fa-file-pdf';
    if (mimetype.includes('word') || mimetype.includes('document')) return 'fa-file-word';
    if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return 'fa-file-excel';
    if (mimetype.includes('powerpoint') || mimetype.includes('presentation')) return 'fa-file-powerpoint';
    if (mimetype.includes('zip') || mimetype.includes('archive')) return 'fa-file-archive';
    if (mimetype.includes('text')) return 'fa-file-alt';
    
    return 'fa-file';
  }

  /**
   * Formats file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Downloads an attachment
   */
  downloadAttachment(attachment: any): void {
    if (!attachment || !attachment.path) return;
    
    const url = this.getAttachmentUrl(attachment);
    const link = document.createElement('a');
    link.href = url;
    link.download = attachment.originalName || attachment.filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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


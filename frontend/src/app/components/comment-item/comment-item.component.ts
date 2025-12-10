import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Comment } from '../../models/user.model';
import { AuthService } from '../../core/services/auth/auth.service';
import { CommentService } from '../../core/services/comment/comment.service';
import { UserService } from '../../core/services/user/user.service';
import { DialogService } from '../../core/services/dialog/dialog.service';
import { ReplyItemComponent } from '../reply-item/reply-item.component';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-comment-item',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    ReplyItemComponent
  ],
  templateUrl: './comment-item.component.html',
  styleUrl: './comment-item.component.scss'
})
export class CommentItemComponent {
  @Input() comment: Comment | null = null;
  @Input() userId: string = '';
  @Input() isAdmin: boolean = false;
  @Input() isEditing: boolean = false;
  @Input() isReplying: boolean = false;
  @Input() isOtherEditing: boolean = false;
  @Input() maxTextLength: number = 150;
  @Input() isExpanded: boolean = false;
  @Input() expandedReplies: Set<string> = new Set<string>();
  @Input() editingReplyId: string | null = null;

  @Output() commentUpdated = new EventEmitter<Comment>();
  @Output() commentDeleted = new EventEmitter<string>();
  @Output() replyAdded = new EventEmitter<{commentId: string, reply: Comment}>();
  @Output() replyUpdated = new EventEmitter<{commentId: string, reply: Comment}>();
  @Output() replyDeleted = new EventEmitter<{commentId: string, replyId: string}>();
  @Output() editStarted = new EventEmitter<Comment>();
  @Output() editCancelled = new EventEmitter<void>();
  @Output() replyStarted = new EventEmitter<Comment>();
  @Output() replyCancelled = new EventEmitter<void>();
  @Output() expansionToggled = new EventEmitter<string>();
  @Output() replyExpansionToggled = new EventEmitter<string>();
  @Output() replyEditStarted = new EventEmitter<Comment>();
  @Output() replyEditCancelled = new EventEmitter<void>();

  editing: boolean = false;
  editText: string = '';
  replying: boolean = false;
  replyText: string = '';
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private commentService: CommentService,
    private userService: UserService,
    private dialogService: DialogService,
    private translateService: TranslateService,
    private cdr: ChangeDetectorRef
  ) {}

  /**
   * Checks if the current user is the author of the comment
   */
  isCommentAuthor(): boolean {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser || !this.comment?.authorId) {
      return false;
    }
    return currentUser.id === this.comment.authorId;
  }

  /**
   * Checks if the current user can delete the comment (author or admin)
   */
  canDeleteComment(): boolean {
    return this.isCommentAuthor() || this.isAdmin;
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
   * Starts editing the comment
   */
  startEdit(): void {
    if (this.isOtherEditing) return;
    this.editing = true;
    this.editText = this.comment?.text || '';
    this.editStarted.emit(this.comment!);
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
   * Saves the edited comment
   */
  saveEdit(): void {
    if (!this.comment || !this.editText.trim()) return;

    this.isLoading = true;
    const commentId = this.comment.id || this.comment._id || '';

    if (!commentId) {
      this.translateService.get(['COMMON.ERROR', 'PROFILE.COMMENT_ID_NOT_FOUND']).subscribe(translations => {
        this.dialogService.showError(
          translations['COMMON.ERROR'] || 'Error',
          translations['PROFILE.COMMENT_ID_NOT_FOUND'] || 'Comment ID not found.'
        );
      });
      this.isLoading = false;
      return;
    }

    this.commentService.updateComment(this.userId, commentId, this.editText).subscribe({
      next: (updatedComment) => {
        const updated: Comment = {
          ...this.comment!,
          text: updatedComment.content || this.editText
        };
        this.commentUpdated.emit(updated);
        this.editing = false;
        this.editText = '';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error updating comment:', error);
        this.translateService.get(['PROFILE.COMMENT_UPDATE_ERROR', 'PROFILE.COMMENT_EDIT_PERMISSION_ERROR', 'COMMON.ERROR']).subscribe(translations => {
          let errorMessage = translations['PROFILE.COMMENT_UPDATE_ERROR'] || 'The comment could not be updated.';
          if (error.status === 403) {
            errorMessage = translations['PROFILE.COMMENT_EDIT_PERMISSION_ERROR'] || 'You do not have permission to edit this comment.';
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
   * Deletes the comment
   */
  deleteComment(): void {
    if (!this.comment) return;

    const commentId = this.comment.id || this.comment._id;

    if (!commentId) {
      this.translateService.get(['COMMON.ERROR', 'PROFILE.COMMENT_ID_NOT_FOUND']).subscribe(translations => {
        this.dialogService.showError(
          translations['COMMON.ERROR'] || 'Error',
          translations['PROFILE.COMMENT_ID_NOT_FOUND'] || 'Comment ID not found.'
        );
      });
      return;
    }

    this.translateService.get(['PROFILE.COMMENT_DELETE_CONFIRMATION', 'PROFILE.COMMENT_DELETE_MESSAGE', 'PROFILE.COMMENT_DELETE_CONFIRM', 'COMMON.CANCEL']).subscribe(translations => {
      this.dialogService.showConfirmation({
        title: translations['PROFILE.COMMENT_DELETE_CONFIRMATION'] || 'Delete Comment',
        message: translations['PROFILE.COMMENT_DELETE_MESSAGE'] || 'Do you really want to delete this comment? This action cannot be undone.',
        confirmText: translations['PROFILE.COMMENT_DELETE_CONFIRM'] || 'Yes, delete',
        cancelText: translations['COMMON.CANCEL'] || 'Cancel',
        dangerMode: true
      }).subscribe(confirmed => {
        if (confirmed) {
          this.isLoading = true;

          this.commentService.deleteComment(this.userId, commentId).subscribe({
            next: () => {
              this.translateService.get(['COMMON.SUCCESS', 'PROFILE.COMMENT_DELETED_SUCCESS', 'COMMON.OK']).subscribe(successTranslations => {
                this.dialogService.showSuccess({
                  title: successTranslations['COMMON.SUCCESS'] || 'Success',
                  message: successTranslations['PROFILE.COMMENT_DELETED_SUCCESS'] || 'Comment was successfully deleted.',
                  buttonText: successTranslations['COMMON.OK'] || 'OK'
                });
              });

              this.commentDeleted.emit(commentId);
              this.isLoading = false;
              this.cdr.detectChanges();
            },
            error: (error) => {
              console.error('Error deleting comment:', error);
              this.translateService.get(['PROFILE.COMMENT_DELETE_ERROR', 'PROFILE.COMMENT_DELETE_PERMISSION_ERROR', 'COMMON.ERROR']).subscribe(errorTranslations => {
                let errorMessage = errorTranslations['PROFILE.COMMENT_DELETE_ERROR'] || 'The comment could not be deleted.';
                if (error.status === 403) {
                  errorMessage = errorTranslations['PROFILE.COMMENT_DELETE_PERMISSION_ERROR'] || 'You do not have permission to delete this comment.';
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
   * Starts replying to the comment
   */
  startReply(): void {
    if (this.isOtherEditing) return;
    this.replying = true;
    this.replyText = '';
    this.replyStarted.emit(this.comment!);
  }

  /**
   * Cancels replying
   */
  cancelReply(): void {
    this.replying = false;
    this.replyText = '';
    this.replyCancelled.emit();
  }

  /**
   * Adds a reply to the comment
   */
  addReply(): void {
    if (!this.comment || !this.replyText.trim()) return;

    this.isLoading = true;
    const commentId = this.comment.id || this.comment._id || '';

    if (!commentId) {
      this.translateService.get(['COMMON.ERROR', 'PROFILE.COMMENT_ID_NOT_FOUND']).subscribe(translations => {
        this.dialogService.showError(
          translations['COMMON.ERROR'] || 'Error',
          translations['PROFILE.COMMENT_ID_NOT_FOUND'] || 'Comment ID not found.'
        );
      });
      this.isLoading = false;
      return;
    }

    this.commentService.addReplyToComment(this.userId, commentId, this.replyText).subscribe({
      next: (reply) => {
        const currentUser = this.authService.currentUserValue;
        if (currentUser) {
          this.userService.getUserById(currentUser.id).subscribe({
            next: (fullUserData) => {
              const authorName = this.createFormalName(fullUserData);

              const newReply: Comment = {
                id: reply.id || reply._id || '',
                userId: this.userId,
                authorId: fullUserData._id || '',
                authorName: authorName,
                text: reply.content || this.replyText,
                createdAt: new Date(reply.time_stamp || new Date()),
                parentId: commentId
              };

              this.replyAdded.emit({ commentId, reply: newReply });
              this.replying = false;
              this.replyText = '';
              this.isLoading = false;
              this.cdr.detectChanges();
            },
            error: (error) => {
              console.error('Error loading user data:', error);
              this.isLoading = false;
            }
          });
        } else {
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error adding reply:', error);
        this.translateService.get(['PROFILE.REPLY_ADD_ERROR', 'COMMON.ERROR']).subscribe(translations => {
          this.dialogService.showError(
            translations['COMMON.ERROR'] || 'Error',
            translations['PROFILE.REPLY_ADD_ERROR'] || 'The reply could not be added.'
          );
        });
        this.isLoading = false;
      }
    });
  }

  /**
   * Creates a formal name from user data
   */
  private createFormalName(user: any): string {
    const parts = [];
    if (user.title) {
      parts.push(user.title);
    }
    if (user.firstName) {
      parts.push(user.firstName);
    }
    if (user.lastName) {
      parts.push(user.lastName);
    }
    return parts.length > 0 ? parts.join(' ') : user.username || 'Unbekannter Benutzer';
  }

  /**
   * Toggles text expansion
   */
  toggleExpansion(): void {
    if (this.comment) {
      const commentId = this.comment.id || this.comment._id || '';
      if (commentId) {
        this.expansionToggled.emit(commentId);
      }
    }
  }

  /**
   * Handles reply update
   */
  onReplyUpdated(event: Comment): void {
    if (this.comment) {
      const commentId = this.comment.id || this.comment._id || '';
      this.replyUpdated.emit({ commentId, reply: event });
    }
  }

  /**
   * Handles reply deletion
   */
  onReplyDeleted(replyId: string): void {
    if (this.comment) {
      const commentId = this.comment.id || this.comment._id || '';
      this.replyDeleted.emit({ commentId, replyId });
    }
  }

  /**
   * Handles reply edit started
   */
  onReplyEditStarted(reply: Comment): void {
    this.replyEditStarted.emit(reply);
  }

  /**
   * Handles reply edit cancelled
   */
  onReplyEditCancelled(): void {
    this.replyEditCancelled.emit();
  }

  /**
   * Handles reply expansion toggle
   */
  onReplyExpansionToggled(replyId: string): void {
    this.replyExpansionToggled.emit(replyId);
  }

  /**
   * Checks if a reply is being edited
   */
  isReplyBeingEdited(replyId: string | undefined): boolean {
    if (!replyId) return false;
    return this.editingReplyId === replyId;
  }

  /**
   * Checks if a reply is expanded
   */
  isReplyExpanded(replyId: string | undefined): boolean {
    if (!replyId) return false;
    return this.expandedReplies.has(replyId);
  }
}


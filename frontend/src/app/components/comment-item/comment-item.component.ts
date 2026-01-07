import { Component, Input, Output, EventEmitter, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Comment } from '../../models/user.model';
import { AuthService, CommentService, UserService, DialogService, UserUtilsService } from '../../core/services';
import { API_CONFIG } from '../../core/config/api.config';
import { ReplyItemComponent } from '../reply-item/reply-item.component';
import { ChangeDetectorRef } from '@angular/core';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

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
export class CommentItemComponent implements AfterViewInit, OnDestroy {
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
  isRichTextEditMode: boolean = false;
  quillEditor: Quill | null = null;
  replying: boolean = false;
  replyText: string = '';
  isRichTextReplyMode: boolean = false;
  quillReplyEditor: Quill | null = null;
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private commentService: CommentService,
    private userService: UserService,
    private dialogService: DialogService,
    private translateService: TranslateService,
    private userUtilsService: UserUtilsService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    // Quill editors will be initialized when edit/reply modes are enabled
  }

  ngOnDestroy(): void {
    // Cleanup Quill editors
    if (this.quillEditor) {
      this.quillEditor = null;
    }
    if (this.quillReplyEditor) {
      this.quillReplyEditor = null;
    }
  }

  /**
   * Creates a Quill editor instance with full formatting options
   */
  private createQuillEditor(editorId: string, initialContent: string = ''): Quill {
    const editorElement = document.getElementById(editorId);
    if (!editorElement) {
      throw new Error(`Editor element with ID ${editorId} not found`);
    }

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
    if (initialContent) {
      if (initialContent.startsWith('<')) {
        // HTML content
        quill.root.innerHTML = initialContent;
      } else {
        // Plain text - convert to HTML
        quill.root.innerHTML = initialContent.replace(/\n/g, '<br>');
      }
    }

    return quill;
  }

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
      // For rich text, use bypassSecurityTrustHtml to preserve inline styles (colors, etc.)
      // Content comes from our own backend, so it's safe
      if (isExpanded) {
        return this.sanitizer.bypassSecurityTrustHtml(text);
      } else {
        // Truncate HTML content
        const plainText = this.stripHtmlTags(text);
        if (plainText.length <= this.maxTextLength) {
          return this.sanitizer.bypassSecurityTrustHtml(text);
        }
        // Truncate and add ellipsis
        const truncatedHtml = this.truncateHtml(text, this.maxTextLength);
        return this.sanitizer.bypassSecurityTrustHtml(truncatedHtml + '...');
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
    
    // Simple truncation - just take first part
    // In a production app, you might want more sophisticated HTML truncation
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
    
    let relativePath = attachment.path;
    
    // Handle absolute paths (old entries in database)
    if (relativePath.includes('uploads')) {
      // Extract relative path from absolute path
      const uploadsIndex = relativePath.indexOf('uploads');
      if (uploadsIndex !== -1) {
        const afterUploads = relativePath.substring(uploadsIndex + 'uploads'.length);
        relativePath = afterUploads.replace(/^[\/\\]+/, ''); // Remove leading slashes
      }
    }
    
    // Ensure path doesn't already start with uploads/
    if (!relativePath.startsWith('uploads/')) {
      relativePath = `uploads/${relativePath}`;
    }
    
    return `${apiBaseUrl}/${relativePath}`;
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
    if (!attachment || !attachment.path) {
      this.translateService.get(['COMMON.ERROR', 'PROFILE.ATTACHMENT_NOT_FOUND']).subscribe(translations => {
        this.dialogService.showError(
          translations['COMMON.ERROR'] || 'Error',
          translations['PROFILE.ATTACHMENT_NOT_FOUND'] || 'Attachment not found.'
        );
      });
      return;
    }
    
    try {
      const url = this.getAttachmentUrl(attachment);
      if (!url) {
        throw new Error('Invalid attachment URL');
      }
      
      // Try to fetch the file first to check if it exists
      fetch(url, { method: 'HEAD' })
        .then(response => {
          if (!response.ok) {
            throw new Error(`File not found: ${response.status} ${response.statusText}`);
          }
          // File exists, proceed with download
          const link = document.createElement('a');
          link.href = url;
          link.download = attachment.originalName || attachment.filename;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        })
        .catch(error => {
          console.error('Error downloading attachment:', error);
          this.translateService.get(['COMMON.ERROR', 'PROFILE.ATTACHMENT_DOWNLOAD_ERROR']).subscribe(translations => {
            this.dialogService.showError(
              translations['COMMON.ERROR'] || 'Error',
              translations['PROFILE.ATTACHMENT_DOWNLOAD_ERROR'] || `Failed to download attachment: ${error.message}`
            );
          });
        });
    } catch (error) {
      console.error('Error downloading attachment:', error);
      this.translateService.get(['COMMON.ERROR', 'PROFILE.ATTACHMENT_DOWNLOAD_ERROR']).subscribe(translations => {
        this.dialogService.showError(
          translations['COMMON.ERROR'] || 'Error',
          translations['PROFILE.ATTACHMENT_DOWNLOAD_ERROR'] || 'Failed to download attachment.'
        );
      });
    }
  }

  /**
   * Starts editing the comment
   */
  startEdit(): void {
    if (this.isOtherEditing) return;
    this.editing = true;
    // Use content if available (for rich text), otherwise use text
    this.editText = this.comment?.content || this.comment?.text || '';
    this.isRichTextEditMode = this.comment?.isRichText || false;
    this.editStarted.emit(this.comment!);
    
    // Initialize Quill editor if rich text mode
    if (this.isRichTextEditMode) {
      setTimeout(() => {
        try {
          this.quillEditor = this.createQuillEditor('edit-comment-quill-editor', this.editText);
          
          // Update editText when content changes
          this.quillEditor.on('text-change', () => {
            const html = this.quillEditor!.root.innerHTML;
            if (html !== '<p><br></p>') {
              this.editText = html;
            } else {
              this.editText = '';
            }
          });
        } catch (error) {
          console.error('Error initializing Quill editor for edit:', error);
          this.isRichTextEditMode = false;
        }
      }, 100);
    }
    this.cdr.detectChanges();
  }

  /**
   * Cancels editing
   */
  cancelEdit(): void {
    this.editing = false;
    this.editText = '';
    this.isRichTextEditMode = false;
    if (this.quillEditor) {
      this.quillEditor = null;
    }
    this.editCancelled.emit();
    this.cdr.detectChanges();
  }

  /**
   * Toggles between plain text and rich text editor for editing
   */
  toggleRichTextEditMode(): void {
    this.isRichTextEditMode = !this.isRichTextEditMode;
    
    if (this.isRichTextEditMode) {
      // Initialize Quill editor
      setTimeout(() => {
        try {
          this.quillEditor = this.createQuillEditor('edit-comment-quill-editor', this.editText);
          
          // Update editText when content changes
          this.quillEditor.on('text-change', () => {
            const html = this.quillEditor!.root.innerHTML;
            if (html !== '<p><br></p>') {
              this.editText = html;
            } else {
              this.editText = '';
            }
          });
        } catch (error) {
          console.error('Error initializing Quill editor for edit:', error);
          this.isRichTextEditMode = false;
        }
      }, 100);
    } else {
      // Convert HTML to plain text when switching back
      if (this.quillEditor) {
        this.editText = this.quillEditor.getText();
        this.quillEditor = null;
      }
    }
    this.cdr.detectChanges();
  }

  /**
   * Saves the edited comment
   */
  saveEdit(): void {
    // Get content from Quill editor if in rich text mode
    let content = this.editText;
    if (this.isRichTextEditMode && this.quillEditor) {
      content = this.quillEditor.root.innerHTML;
      // Check if content is empty (Quill uses <p><br></p> for empty)
      if (content === '<p><br></p>' || content.trim() === '') {
        return;
      }
    } else if (!content.trim()) {
      return;
    }

    if (!this.comment) return;

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

    this.commentService.updateComment(this.userId, commentId, content, this.isRichTextEditMode).subscribe({
      next: (updatedComment) => {
        const updated: Comment = {
          ...this.comment!,
          text: updatedComment.content || content,
          content: updatedComment.content || content,
          isRichText: updatedComment.isRichText || this.isRichTextEditMode
        };
        this.commentUpdated.emit(updated);
        this.editing = false;
        this.editText = '';
        this.isRichTextEditMode = false;
        if (this.quillEditor) {
          this.quillEditor = null;
        }
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
    this.isRichTextReplyMode = false;
    this.replyStarted.emit(this.comment!);
    this.cdr.detectChanges();
  }

  /**
   * Cancels replying
   */
  cancelReply(): void {
    this.replying = false;
    this.replyText = '';
    this.isRichTextReplyMode = false;
    if (this.quillReplyEditor) {
      this.quillReplyEditor = null;
    }
    this.replyCancelled.emit();
    this.cdr.detectChanges();
  }

  /**
   * Toggles between plain text and rich text editor for replies
   */
  toggleRichTextReplyMode(): void {
    this.isRichTextReplyMode = !this.isRichTextReplyMode;
    
    if (this.isRichTextReplyMode) {
      // Initialize Quill editor
      setTimeout(() => {
        try {
          this.quillReplyEditor = this.createQuillEditor('reply-quill-editor', this.replyText);
          
          // Update replyText when content changes
          this.quillReplyEditor.on('text-change', () => {
            const html = this.quillReplyEditor!.root.innerHTML;
            if (html !== '<p><br></p>') {
              this.replyText = html;
            } else {
              this.replyText = '';
            }
          });
        } catch (error) {
          console.error('Error initializing Quill editor for reply:', error);
          this.isRichTextReplyMode = false;
        }
      }, 100);
    } else {
      // Convert HTML to plain text when switching back
      if (this.quillReplyEditor) {
        this.replyText = this.quillReplyEditor.getText();
        this.quillReplyEditor = null;
      }
    }
    this.cdr.detectChanges();
  }

  /**
   * Adds a reply to the comment
   */
  addReply(): void {
    // Get content from Quill editor if in rich text mode
    let content = this.replyText;
    if (this.isRichTextReplyMode && this.quillReplyEditor) {
      content = this.quillReplyEditor.root.innerHTML;
      // Check if content is empty (Quill uses <p><br></p> for empty)
      if (content === '<p><br></p>' || content.trim() === '') {
        return;
      }
    } else if (!content.trim()) {
      return;
    }

    if (!this.comment) return;

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

    this.commentService.addReplyToComment(this.userId, commentId, content, this.isRichTextReplyMode).subscribe({
      next: (reply) => {
        const currentUser = this.authService.currentUserValue;
        if (currentUser) {
          this.userService.getUserById(currentUser.id).subscribe({
            next: (fullUserData) => {
              const authorName = this.userUtilsService.createFormalName(fullUserData);

              const newReply: Comment = {
                id: reply.id || reply._id || '',
                userId: this.userId,
                authorId: fullUserData._id || '',
                authorName: authorName,
                text: reply.content || content,
                content: reply.content || content,
                isRichText: reply.isRichText || this.isRichTextReplyMode,
                attachments: reply.attachments || [],
                createdAt: new Date(reply.time_stamp || new Date()),
                parentId: commentId
              };

              this.replyAdded.emit({ commentId, reply: newReply });
              this.replying = false;
              this.replyText = '';
              this.isRichTextReplyMode = false;
              if (this.quillReplyEditor) {
                this.quillReplyEditor = null;
              }
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


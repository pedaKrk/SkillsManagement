import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Comment } from '../../models/user.model';
import { CommentService } from '../../core/services/comment/comment.service';
import { UserService } from '../../core/services/user/user.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { DialogService } from '../../core/services/dialog/dialog.service';
import { CommentFilterComponent, CommentFilters } from '../comment-filter/comment-filter.component';
import { CommentItemComponent } from '../comment-item/comment-item.component';

@Component({
  selector: 'app-user-comments-section',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    CommentFilterComponent,
    CommentItemComponent
  ],
  templateUrl: './user-comments-section.component.html',
  styleUrl: './user-comments-section.component.scss'
})
export class UserCommentsSectionComponent implements OnInit, OnDestroy {
  @Input() userId: string = '';
  @Input() canAddComments: boolean = false;
  @Input() isAdmin: boolean = false;

  @Output() commentsLoaded = new EventEmitter<Comment[]>();

  comments: Comment[] = [];
  filteredComments: Comment[] = [];
  isLoading: boolean = false;
  newComment: string = '';

  // Filter state
  filters: CommentFilters = {
    searchTerm: '',
    selectedAuthor: '',
    dateFrom: '',
    dateTo: ''
  };

  // Text expansion state
  expandedComments: Set<string> = new Set<string>();
  expandedReplies: Set<string> = new Set<string>();
  maxTextLength: number = 150;

  // Editing state
  editingCommentId: string | null = null;
  replyingToCommentId: string | null = null;
  editingReplyId: string | null = null;

  constructor(
    private commentService: CommentService,
    private userService: UserService,
    private authService: AuthService,
    private dialogService: DialogService,
    private translateService: TranslateService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.userId) {
      this.loadComments();
    }
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  /**
   * Loads comments for the user
   */
  loadComments(): void {
    this.isLoading = true;

    this.commentService.getCommentsForUser(this.userId).subscribe({
      next: (comments) => {
        // Collect all unique user IDs
        const authorIds = new Set<string>();
        comments.forEach(comment => {
          if (comment.author?._id) {
            authorIds.add(comment.author._id);
          }
          if (comment.replies) {
            comment.replies.forEach((reply: { author?: { _id?: string } }) => {
              if (reply.author?._id) {
                authorIds.add(reply.author._id);
              }
            });
          }
        });

        // Load user data for all authors
        Promise.all(
          Array.from(authorIds).map(authorId => this.userService.getUserById(authorId).toPromise())
        ).then(authors => {
          // Create a map for quick access to user data
          const authorMap = new Map(
            authors
              .filter(author => author != null)
              .map(author => [author._id, author])
          );

          // Convert comments to the correct format
          this.comments = comments.map(comment => {
            const author = comment.author?._id ? authorMap.get(comment.author._id) : null;
            const authorData = author || comment.author || { username: 'Unbekannt' };
            const authorName = this.createFormalName(authorData);

            // Convert replies, if available
            const commentId = comment.id || comment._id || '';
            const replies = comment.replies ? comment.replies.map((reply: any) => {
              const replyAuthor = reply.author?._id ? authorMap.get(reply.author._id) : null;
              const replyAuthorData = replyAuthor || reply.author || { username: 'Unbekannt' };
              const replyAuthorName = this.createFormalName(replyAuthorData);

              // Get parentComment ID from reply object, or fallback to the comment ID
              const parentId = reply.parentComment?._id || reply.parentComment || commentId;

              return {
                id: reply.id || reply._id || '',
                userId: this.userId,
                authorId: replyAuthorData._id || '',
                authorName: replyAuthorName,
                text: reply.content || '',
                createdAt: new Date(reply.time_stamp || new Date()),
                parentId: parentId
              };
            }) : [];

            return {
              id: comment.id || comment._id || '',
              userId: this.userId,
              authorId: authorData._id || '',
              authorName: authorName,
              text: comment.content || '',
              createdAt: new Date(comment.time_stamp || new Date()),
              replies: replies
            };
          });

          this.applyFilters();
          this.commentsLoaded.emit(this.comments);
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('Error loading comments:', error);
        this.comments = [];
        this.filteredComments = [];
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Gets all unique authors from comments
   */
  getUniqueAuthors(): {id: string, name: string}[] {
    const uniqueAuthors = new Map<string, string>();

    this.comments.forEach(comment => {
      if (comment.authorId && comment.authorName) {
        uniqueAuthors.set(comment.authorId, comment.authorName);
      }
    });

    return Array.from(uniqueAuthors.entries()).map(([id, name]) => ({
      id,
      name
    }));
  }

  /**
   * Filters comments based on filter criteria
   */
  applyFilters(): void {
    let filtered = [...this.comments];

    // Filter by search term
    if (this.filters.searchTerm.trim()) {
      const term = this.filters.searchTerm.toLowerCase();
      filtered = filtered.filter(comment => {
        const matchesComment = comment.text?.toLowerCase().includes(term) ||
                               comment.authorName?.toLowerCase().includes(term);
        const matchesReply = comment.replies?.some(reply =>
          reply.text?.toLowerCase().includes(term) ||
          reply.authorName?.toLowerCase().includes(term)
        );
        return matchesComment || matchesReply;
      });
    }

    // Filter by author
    if (this.filters.selectedAuthor) {
      filtered = filtered.filter(comment => {
        const matchesComment = comment.authorId === this.filters.selectedAuthor;
        const matchesReply = comment.replies?.some(reply => reply.authorId === this.filters.selectedAuthor);
        return matchesComment || matchesReply;
      });
    }

    // Filter by date range
    if (this.filters.dateFrom) {
      const fromDate = new Date(this.filters.dateFrom);
      filtered = filtered.filter(comment => {
        const commentDate = new Date(comment.createdAt);
        const matchesComment = commentDate >= fromDate;
        const matchesReply = comment.replies?.some(reply => {
          const replyDate = new Date(reply.createdAt);
          return replyDate >= fromDate;
        });
        return matchesComment || matchesReply;
      });
    }

    if (this.filters.dateTo) {
      const toDate = new Date(this.filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(comment => {
        const commentDate = new Date(comment.createdAt);
        const matchesComment = commentDate <= toDate;
        const matchesReply = comment.replies?.some(reply => {
          const replyDate = new Date(reply.createdAt);
          return replyDate <= toDate;
        });
        return matchesComment || matchesReply;
      });
    }

    this.filteredComments = filtered;
  }

  /**
   * Handles filter changes
   */
  onFiltersChanged(filters: CommentFilters): void {
    this.filters = filters;
    this.applyFilters();
  }

  /**
   * Adds a new comment
   */
  addComment(): void {
    if (!this.newComment.trim()) {
      return;
    }

    this.isLoading = true;

    const currentUser = this.authService.currentUserValue;
    if (!currentUser || !currentUser.token) {
      console.error('Benutzer ist nicht angemeldet');
      this.dialogService.showError(
        'Fehler',
        'Sie müssen angemeldet sein, um Kommentare hinzuzufügen.'
      );
      this.isLoading = false;
      return;
    }

    this.commentService.addCommentToUser(this.userId, this.newComment).subscribe({
      next: (comment) => {
        if (comment && (comment.id || comment._id)) {
          this.userService.getUserById(currentUser.id).subscribe({
            next: (fullUserData) => {
              const authorName = this.createFormalName(fullUserData);

              const newComment: Comment = {
                id: comment.id || comment._id || '',
                userId: this.userId,
                authorId: comment.author?._id || currentUser.id,
                authorName: authorName,
                text: comment.content || this.newComment,
                createdAt: new Date(comment.time_stamp) || new Date(),
                replies: []
              };

              this.comments.unshift(newComment);
              this.newComment = '';
              this.applyFilters();

              this.translateService.get(['COMMON.SUCCESS', 'PROFILE.COMMENT_ADDED_SUCCESS', 'COMMON.OK']).subscribe(translations => {
                this.dialogService.showSuccess({
                  title: translations['COMMON.SUCCESS'] || 'Success',
                  message: translations['PROFILE.COMMENT_ADDED_SUCCESS'] || 'Comment was successfully added.',
                  buttonText: translations['COMMON.OK'] || 'OK'
                });
              });

              this.isLoading = false;
              this.cdr.detectChanges();
            },
            error: (error) => {
              console.error('Fehler beim Laden der Benutzerdaten:', error);
              const newComment: Comment = {
                id: comment.id || comment._id || '',
                userId: this.userId,
                authorId: comment.author?._id || currentUser.id,
                authorName: currentUser.username || 'Unbekannter Benutzer',
                text: comment.content || this.newComment,
                createdAt: new Date(comment.time_stamp) || new Date(),
                replies: []
              };

              this.comments.unshift(newComment);
              this.newComment = '';
              this.applyFilters();
              this.isLoading = false;
              this.cdr.detectChanges();
            }
          });
        }
      },
      error: (error) => {
        console.error('Error adding comment:', error);
        this.translateService.get(['COMMON.ERROR', 'PROFILE.COMMENT_ADD_ERROR']).subscribe(translations => {
          this.dialogService.showError(
            translations['COMMON.ERROR'] || 'Error',
            translations['PROFILE.COMMENT_ADD_ERROR'] || 'The comment could not be added. Please try again later.'
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
   * Handles comment update
   */
  onCommentUpdated(comment: Comment): void {
    const index = this.comments.findIndex(c => (c.id || c._id) === (comment.id || comment._id));
    if (index !== -1) {
      this.comments[index] = comment;
      this.applyFilters();
      this.cdr.detectChanges();
    }
  }

  /**
   * Handles comment deletion
   */
  onCommentDeleted(commentId: string): void {
    this.comments = this.comments.filter(c => (c.id || c._id) !== commentId);
    this.applyFilters();
    this.editingCommentId = null;
    this.cdr.detectChanges();
  }

  /**
   * Handles reply addition
   */
  onReplyAdded(event: {commentId: string, reply: Comment}): void {
    const comment = this.comments.find(c => (c.id || c._id) === event.commentId);
    if (comment) {
      if (!comment.replies) {
        comment.replies = [];
      }
      comment.replies.push(event.reply);
      this.applyFilters();
      this.replyingToCommentId = null;
      this.cdr.detectChanges();
    }
  }

  /**
   * Handles reply update
   */
  onReplyUpdated(event: {commentId: string, reply: Comment}): void {
    const comment = this.comments.find(c => (c.id || c._id) === event.commentId);
    if (comment && comment.replies) {
      const replyIndex = comment.replies.findIndex(r => (r.id || r._id) === (event.reply.id || event.reply._id));
      if (replyIndex !== -1) {
        comment.replies[replyIndex] = event.reply;
        this.applyFilters();
        this.editingReplyId = null;
        this.cdr.detectChanges();
      }
    }
  }

  /**
   * Handles reply deletion
   */
  onReplyDeleted(event: {commentId: string, replyId: string}): void {
    const comment = this.comments.find(c => (c.id || c._id) === event.commentId);
    if (comment && comment.replies) {
      comment.replies = comment.replies.filter(r => (r.id || r._id) !== event.replyId);
      this.applyFilters();
      this.editingReplyId = null;
      this.cdr.detectChanges();
    }
  }

  /**
   * Handles comment edit started
   */
  onCommentEditStarted(comment: Comment): void {
    this.editingCommentId = comment.id || comment._id || null;
    this.replyingToCommentId = null;
  }

  /**
   * Handles comment edit cancelled
   */
  onCommentEditCancelled(): void {
    this.editingCommentId = null;
  }

  /**
   * Handles reply started
   */
  onReplyStarted(comment: Comment): void {
    this.replyingToCommentId = comment.id || comment._id || null;
    this.editingCommentId = null;
  }

  /**
   * Handles reply cancelled
   */
  onReplyCancelled(): void {
    this.replyingToCommentId = null;
  }

  /**
   * Handles reply edit started
   */
  onReplyEditStarted(reply: Comment): void {
    this.editingReplyId = reply.id || reply._id || null;
    this.editingCommentId = null;
    this.replyingToCommentId = null;
  }

  /**
   * Handles reply edit cancelled
   */
  onReplyEditCancelled(): void {
    this.editingReplyId = null;
  }

  /**
   * Handles comment expansion toggle
   */
  onCommentExpansionToggled(commentId: string): void {
    if (this.expandedComments.has(commentId)) {
      this.expandedComments.delete(commentId);
    } else {
      this.expandedComments.add(commentId);
    }
    this.cdr.detectChanges();
  }

  /**
   * Handles reply expansion toggle
   */
  onReplyExpansionToggled(replyId: string): void {
    if (this.expandedReplies.has(replyId)) {
      this.expandedReplies.delete(replyId);
    } else {
      this.expandedReplies.add(replyId);
    }
    this.cdr.detectChanges();
  }

  /**
   * Checks if a comment is being edited
   */
  isCommentBeingEdited(commentId: string | undefined): boolean {
    if (!commentId) return false;
    return this.editingCommentId === commentId;
  }

  /**
   * Checks if replying to a comment
   */
  isReplyingToComment(commentId: string | undefined): boolean {
    if (!commentId) return false;
    return this.replyingToCommentId === commentId;
  }

  /**
   * Checks if a comment is expanded
   */
  isCommentExpanded(commentId: string | undefined): boolean {
    if (!commentId) return false;
    return this.expandedComments.has(commentId);
  }
}


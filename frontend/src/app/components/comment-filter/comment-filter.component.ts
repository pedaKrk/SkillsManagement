import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

export interface CommentFilters {
  searchTerm: string;
  selectedAuthor: string;
  dateFrom: string;
  dateTo: string;
}

@Component({
  selector: 'app-comment-filter',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule
  ],
  templateUrl: './comment-filter.component.html',
  styleUrl: './comment-filter.component.scss'
})
export class CommentFilterComponent implements OnInit {
  @Input() authors: {id: string, name: string}[] = [];
  @Input() initialFilters: CommentFilters = {
    searchTerm: '',
    selectedAuthor: '',
    dateFrom: '',
    dateTo: ''
  };

  @Output() filtersChanged = new EventEmitter<CommentFilters>();

  searchTerm: string = '';
  selectedAuthor: string = '';
  dateFrom: string = '';
  dateTo: string = '';
  isAuthorDropdownOpen: boolean = false;

  ngOnInit(): void {
    this.searchTerm = this.initialFilters.searchTerm || '';
    this.selectedAuthor = this.initialFilters.selectedAuthor || '';
    this.dateFrom = this.initialFilters.dateFrom || '';
    this.dateTo = this.initialFilters.dateTo || '';
  }

  /**
   * Gets the name of an author by its ID
   * @param authorId The ID of the author
   * @returns The name of the author or "All authors", if no ID is given
   */
  getAuthorNameById(authorId: string): string {
    if (!authorId) return 'Alle Autoren';

    const author = this.authors.find(a => a.id === authorId);
    return author ? author.name : 'Unbekannter Autor';
  }

  /**
   * Selects an author
   * @param authorId The ID of the author to select
   */
  selectAuthor(authorId: string): void {
    this.selectedAuthor = authorId;
    this.isAuthorDropdownOpen = false;
    this.emitFilters();
  }

  /**
   * Toggles the author dropdown
   */
  toggleAuthorDropdown(): void {
    this.isAuthorDropdownOpen = !this.isAuthorDropdownOpen;
  }

  /**
   * Emits the current filter values
   */
  emitFilters(): void {
    this.filtersChanged.emit({
      searchTerm: this.searchTerm,
      selectedAuthor: this.selectedAuthor,
      dateFrom: this.dateFrom,
      dateTo: this.dateTo
    });
  }

  /**
   * Called when search term changes
   */
  onSearchTermChange(): void {
    this.emitFilters();
  }

  /**
   * Called when date from changes
   */
  onDateFromChange(): void {
    this.emitFilters();
  }

  /**
   * Called when date to changes
   */
  onDateToChange(): void {
    this.emitFilters();
  }
}


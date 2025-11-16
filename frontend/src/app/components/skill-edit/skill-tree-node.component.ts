import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { trigger, state, style, transition, animate } from '@angular/animations';

export interface SkillWithChildren {
  _id: string;
  name: string;
  parent_id?: string | null;
  children?: SkillWithChildren[];
  isExpanded?: boolean;
  isEditing?: boolean;
  tempName?: string;
  searchPath?: string;
}

@Component({
  selector: 'app-skill-tree-node',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatTooltipModule,
    TranslateModule
  ],
  templateUrl: './skill-tree-node.component.html',
  styleUrls: ['./skill-tree-node.component.scss'],
  animations: [
    trigger('expandCollapse', [
      state('void', style({
        height: '0',
        opacity: '0'
      })),
      state('*', style({
        height: '*',
        opacity: '1'
      })),
      transition('void <=> *', [
        animate('300ms ease-in-out')
      ])
    ])
  ]
})
export class SkillTreeNodeComponent {
  @Input() skill!: SkillWithChildren;
  @Input() depth: number = 0;
  @Input() isAdmin: boolean = false;
  
  @Output() toggleExpand = new EventEmitter<SkillWithChildren>();
  @Output() startEditing = new EventEmitter<SkillWithChildren>();
  @Output() saveEdit = new EventEmitter<SkillWithChildren>();
  @Output() cancelEdit = new EventEmitter<SkillWithChildren>();
  @Output() addSkill = new EventEmitter<string>();
  @Output() deleteSkill = new EventEmitter<SkillWithChildren>();

  onToggleExpand() {
    this.toggleExpand.emit(this.skill);
  }

  onStartEditing(event: Event) {
    event.stopPropagation();
    this.startEditing.emit(this.skill);
  }

  onSaveEdit(event: Event) {
    event.stopPropagation();
    this.saveEdit.emit(this.skill);
  }

  onCancelEdit(event: Event) {
    event.stopPropagation();
    this.cancelEdit.emit(this.skill);
  }

  onAddSkill(event: Event) {
    event.stopPropagation();
    this.addSkill.emit(this.skill._id);
  }

  onDeleteSkill(event: Event) {
    event.stopPropagation();
    this.deleteSkill.emit(this.skill);
  }

  getNodeClass(): string {
    if (this.depth === 0) {
      return 'root-node';
    } else if (this.depth === 1) {
      return 'child-node';
    } else {
      return 'nested-node';
    }
  }

  getMarginLeft(): string {
    return `${this.depth * 40}px`;
  }
}


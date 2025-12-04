import { Component, ElementRef, Input } from '@angular/core';
import { ChatUser } from '../../../../core/models/user.class';

@Component({
    selector: 'app-mention',
    imports: [],
    templateUrl: './mention.component.html',
    styleUrl: './mention.component.scss'
})
export class MentionComponent {
  @Input() user!: ChatUser;

  constructor(private el: ElementRef) { }

  selectMention() {
    const selection = window.getSelection();
    selection?.removeAllRanges();
    const range = document.createRange();
    range.selectNodeContents(this.el.nativeElement);
    selection?.addRange(range);
  }
}
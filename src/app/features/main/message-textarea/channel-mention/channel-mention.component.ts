import { Component, ElementRef, Input } from '@angular/core';
import { Channel } from '../../../../core/models/channel.class';

@Component({
    selector: 'app-channel-mention',
    imports: [],
    templateUrl: './channel-mention.component.html',
    styleUrl: './channel-mention.component.scss'
})
export class ChannelMentionComponent {
  @Input() channel!: Channel;

  constructor(private el: ElementRef) { }

  selectMention() {
    const selection = window.getSelection();
    selection?.removeAllRanges();
    const range = document.createRange();
    range.selectNodeContents(this.el.nativeElement);
    selection?.addRange(range);
  }
}

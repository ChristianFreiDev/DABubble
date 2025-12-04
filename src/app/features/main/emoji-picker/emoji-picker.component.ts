import { Component, EventEmitter, Output } from '@angular/core';
import { SideNavService } from '../../../core/services/sideNav/side-nav.service';

@Component({
    selector: 'app-emoji-picker',
    imports: [],
    templateUrl: './emoji-picker.component.html',
    styleUrl: './emoji-picker.component.scss'
})
export class EmojiPickerComponent {
  constructor(public sideNavService: SideNavService){}
  emojis: string[] = [
    '😁','😀','😃','😄','😉','😊','😋','😎','🙂','😚','😪','😴','😌','😛','🤐','😂','🤣','😐','🤔','😮','😬','🤯','😇','🥳'
  ]

  @Output() selectEmojiEvent = new EventEmitter<string>();

  selectEmoji(emoji: string) {
    this.selectEmojiEvent.emit(emoji);
  }
}

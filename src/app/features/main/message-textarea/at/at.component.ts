import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ChatService } from '../../../../core/services/chat/chat.service';
import { ChatUser } from '../../../../core/models/user.class';
import { Channel } from '../../../../core/models/channel.class';

@Component({
    selector: 'app-at',
    imports: [],
    templateUrl: './at.component.html',
    styleUrl: './at.component.scss'
})
export class AtComponent {

  constructor(private chatService: ChatService) {}

  @Input('usersOrChannels') usersOrChannels: any;
  @Output() selectUserEvent = new EventEmitter<ChatUser|Channel>();

  selectOption(index: number) {
    const userOrChannel = this.usersOrChannels()[index];
    this.selectUserEvent.emit(userOrChannel);
  }

  isChatUser(option:  ChatUser | Channel): boolean {
    return this.chatService.isChatUser(option);
  }
}

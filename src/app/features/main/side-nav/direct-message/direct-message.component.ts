import { Component, Signal } from '@angular/core';
import { MessageTextareaComponent } from '../../message-textarea/message-textarea.component';
import { ChatService } from '../../../../core/services/chat/chat.service';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../../core/services/user/user.service';
import { Message } from '../../../../core/models/message.class';
import { ChatBottomContainerComponent } from '../../chat/chat-bottom-container/chat-bottom-container.component';
import { Channel } from '../../../../core/models/channel.class';


@Component({
    selector: 'app-direct-message',
    imports: [MessageTextareaComponent, CommonModule, ChatBottomContainerComponent],
    templateUrl: './direct-message.component.html',
    styleUrl: './direct-message.component.scss'
})
export class DirectMessageComponent {
  channel: Signal<Channel> = this.chatService.currentDirectMessageChannel;
  messages: Signal<Message[]> = this.chatService.directMessages;

  constructor(
    public chatService: ChatService,
    public userService: UserService,
  ) {}
}

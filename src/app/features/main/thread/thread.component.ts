import { Component, QueryList, Signal, ViewChildren } from '@angular/core';
import { Message } from '../../../core/models/message.class';
import { MessageComponent } from '../message/message.component';
import { CommonModule } from '@angular/common';
import { MessageTextareaComponent } from '../message-textarea/message-textarea.component';
import { ChatService } from '../../../core/services/chat/chat.service';
import { Channel } from '../../../core/models/channel.class';
import { LayoutService } from '../../../core/services/layout/layout.service';
import { UserService } from '../../../core/services/user/user.service';

@Component({
    selector: 'app-thread',
    imports: [MessageComponent, MessageTextareaComponent, CommonModule],
    templateUrl: './thread.component.html',
    styleUrl: './thread.component.scss'
})
export class ThreadComponent {
  
  channel: Signal<Channel> = this.chatService.currentChannel;
  
  constructor(public chatService: ChatService, public layoutService: LayoutService, public userService: UserService) { }

  message: Signal<Message> = this.chatService.topThreadMessage;
  replies: Signal<Message[]> = this.chatService.threadReplies;

  @ViewChildren(MessageComponent) messageComponents!: QueryList<MessageComponent>;

  closeThread() {
    this.layoutService.selectThread(false);
  }

  deselectMessages() {
    this.messageComponents.forEach(message => message.isHighlightingMessage = false);
  }
}

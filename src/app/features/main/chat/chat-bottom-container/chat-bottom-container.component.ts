import { Component, ElementRef, Input, QueryList, Signal, ViewChildren } from '@angular/core';
import { MessageComponent } from '../../message/message.component';
import { Channel } from '../../../../core/models/channel.class';
import { Message } from '../../../../core/models/message.class';

@Component({
    selector: 'app-chat-bottom-container',
    imports: [MessageComponent],
    templateUrl: './chat-bottom-container.component.html',
    styleUrl: './chat-bottom-container.component.scss'
})
export class ChatBottomContainerComponent {
  @Input() type: string = 'chat';
  @Input() channel!: Signal<Channel>;
  @Input() messages!: Signal<Message[]>;
  @ViewChildren(MessageComponent) messageComponents!: QueryList<MessageComponent>;
  constructor(public elementRef: ElementRef) {}

  isSameDay(firstDate: Date, secondDate: Date) {
    return firstDate.getFullYear() == secondDate.getFullYear() && firstDate.getMonth() == secondDate.getMonth() && firstDate.getDate() == secondDate.getDate();
  }
  
  isAnotherDay(messageA: Message, messageB: Message) {
    const firstDate = messageA.postedAt;
    const secondDate = messageB.postedAt;
    if (this.isSameDay(firstDate, secondDate)) {
      return false;
    } else {
      return true;
    }
  }

  getLongGermanDate(date: Date) {
    return date.toLocaleDateString("de-DE", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }

  getDateInfo(message: Message) {
    if (message) {
      const today = new Date();
      if (this.isSameDay(message.postedAt, today)) {
        return 'Heute';
      } else {
        return this.getLongGermanDate(message.postedAt);
      }
    } else {
      return '';
    }
  }
  
  deselectMessages() {
    this.messageComponents.forEach(message => message.isHighlightingMessage = false);
  }
}

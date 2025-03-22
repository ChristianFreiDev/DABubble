import { Component, computed, Signal, ViewChild } from '@angular/core';
import { ChatService } from '../../../core/services/chat/chat.service';
import { MessageTextareaComponent } from '../message-textarea/message-textarea.component';
import { Message } from '../../../core/models/message.class';
import { SlicePipe } from '@angular/common';
import { Channel } from '../../../core/models/channel.class';
import { ChatUser } from '../../../core/models/user.class';
import { AddPeopleComponent } from './add-people/add-people.component';
import { MembersComponent } from './members/members.component';
import { ChatBottomContainerComponent } from './chat-bottom-container/chat-bottom-container.component';
import { DialogService } from '../../../core/services/dialog/dialog.service';
import { UserService } from '../../../core/services/user/user.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [MessageTextareaComponent, AddPeopleComponent, MembersComponent, ChatBottomContainerComponent, SlicePipe],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent {
  channel: Signal<Channel> = this.chatService.currentChannel;
  isMe: Signal<boolean> = computed(() => this.channel().createdById === this.userService.currentUserUID());
  userAvatars: string[] = ['avatar0.svg', 'avatar1.svg', 'avatar2.svg', 'avatar3.svg', 'avatar4.svg', 'avatar5.svg'];
  usersInCurrentChannel: Signal<ChatUser[]> = this.chatService.usersInCurrentChannel;
  messages: Signal<Message[]> = this.chatService.messages;
  isAddPeopleDialogVisible: Signal<boolean> = this.dialogService.openAddPeople;
  isMembersDialogVisible: Signal<boolean> = this.dialogService.openMembers;
  @ViewChild('messageContainer') messageContainer!: ChatBottomContainerComponent;

  constructor(public chatService: ChatService, private dialogService: DialogService, private userService: UserService) { }

  toggleEditChannelVisibility() {
    this.dialogService.toggleEditChannelVisibility();
  }

  toggleMembersVisibility() {
    this.dialogService.toggleMembersVisibility();
  }

  openAddPeople() {
    this.dialogService.toggleAddPeopleVisibility();
  }
}

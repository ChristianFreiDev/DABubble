import { Component, ElementRef, Signal, ViewChild } from '@angular/core';
import { ChatService } from '../../../../core/services/chat/chat.service';
import { Channel } from '../../../../core/models/channel.class';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MembersComponent } from '../members/members.component';
import { DialogService } from '../../../../core/services/dialog/dialog.service';
import { UserService } from '../../../../core/services/user/user.service';

@Component({
    selector: 'app-edit-channel',
    imports: [CommonModule, FormsModule, MembersComponent],
    templateUrl: './edit-channel.component.html',
    styleUrl: './edit-channel.component.scss'
})
export class EditChannelComponent {

  isChannelNameEditable: boolean = false;
  isChannelDescriptionEditable: boolean = false;
  currentChannel: Signal<Channel> = this.chatService.currentChannel;
  channels: Signal<Channel[]> = this.chatService.channels;
  channelNameError: boolean = false;
  channelDescriptionError: boolean = false;
  @ViewChild('channelDescriptionInput') channelDescriptionInput!: ElementRef;

  constructor(private chatService: ChatService, private dialogService: DialogService, private userService: UserService) {}

  ngAfterViewInit() {
    this.resizeTextArea();
  }

  toggleChannelNameEdit(channelName: string, channelNameInput: HTMLInputElement) {
    if (this.isChannelNameEditable) {
      this.channelNameError = false;
      const channel = this.channels().find(channel => channel.name === channelName);
      if (channel) {
        this.channelNameError = true;
        channelNameInput.value = this.currentChannel().name;
      } else {
        if (this.isChannelNameEditable) {
          try {
            this.chatService.updateChannel({name: channelName});
          } catch {
            this.channelNameError = true;
          }
        }
      }
    } else {
      this.channelNameError = false;
    }
    this.isChannelNameEditable = !this.isChannelNameEditable;
  }

  toggleChannelDescriptionEdit(channelDescription: string) {
    setTimeout(() => {
      this.resizeTextArea();
    }, 0);
    if (this.isChannelDescriptionEditable) {
      this.channelDescriptionError = false;
      try {
        this.chatService.updateChannel({description: channelDescription});
      } catch {
        this.channelDescriptionError = true;
      }
    } else {
      this.channelDescriptionError = false;
    }
    this.isChannelDescriptionEditable = !this.isChannelDescriptionEditable;
  }

  closeDialog() {
    this.dialogService.toggleEditChannelVisibility();
  }

  leaveChannel() {
    this.chatService.leaveChannel();
    this.closeDialog();
  }

  resizeTextArea() {
    if (this.channelDescriptionInput) {
      this.channelDescriptionInput.nativeElement.style.height = '';
      this.channelDescriptionInput.nativeElement.style.height = this.channelDescriptionInput.nativeElement.scrollHeight + 2 + 'px';
    }
  }

  getUserName() {
    const userName = this.userService.getUserName(this.currentChannel().createdById);
    if (userName) {
      return userName;
    } else {
      return this.currentChannel().createdByName;
    }
  }
}

import { Component, Input, Signal } from '@angular/core';
import { ChatUser } from '../../../../core/models/user.class';
import { ChatService } from '../../../../core/services/chat/chat.service';
import { CommonModule } from '@angular/common';
import { DialogService } from '../../../../core/services/dialog/dialog.service';

@Component({
    selector: 'app-members',
    imports: [CommonModule],
    templateUrl: './members.component.html',
    styleUrl: './members.component.scss'
})
export class MembersComponent {
  members: Signal<ChatUser[]> = this.chatService.usersInCurrentChannel;
  @Input('isEditChannel') isEditChannel: boolean = false;

  constructor(private chatService: ChatService, private dialogService: DialogService) { }

  closeDialog() {
    this.dialogService.toggleMembersVisibility();
  }

  openAddPeople() {
    this.dialogService.toggleAddPeopleVisibility();
  }

  openViewProfile(userUID: string) {
    if (this.dialogService.openMembers()) {
      this.dialogService.toggleMembersVisibility();
    } else {
      this.dialogService.toggleEditChannelVisibility();
    }
    this.chatService.openViewProfile(userUID);
  }
}

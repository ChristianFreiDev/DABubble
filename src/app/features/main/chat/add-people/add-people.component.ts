import { Component, Signal } from '@angular/core';
import { Channel } from '../../../../core/models/channel.class';
import { ChatService } from '../../../../core/services/chat/chat.service';
import { FilterNameComponent } from '../../../../shared/filter-name/filter-name.component';
import { DialogService } from '../../../../core/services/dialog/dialog.service';

@Component({
    selector: 'app-add-people',
    imports: [FilterNameComponent],
    templateUrl: './add-people.component.html',
    styleUrl: './add-people.component.scss'
})
export class AddPeopleComponent {
  currentChannel: Signal<Channel> = this.chatService.currentChannel;

  constructor(public chatService: ChatService, private dialogService: DialogService) { }

  closeDialog() {
    this.dialogService.toggleAddPeopleVisibility();
    this.chatService.updateChosenUserUIDs([]);
  }

  addPersonToCurrentChannel() {
    if (this.chatService.chosenUserUIDs().length > 0) {
      this.chatService.chosenUserUIDs().forEach(userUID => {
        this.chatService.addPersonToCurrentChannel(userUID);
      })
      this.closeDialog();
    }
  }
}

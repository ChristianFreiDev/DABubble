import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { MessageTextareaComponent } from '../../message-textarea/message-textarea.component';
import { CommonModule } from '@angular/common';
import { SideNavService } from '../../../../core/services/sideNav/side-nav.service';
import { ChatService } from '../../../../core/services/chat/chat.service';
import { UserService } from '../../../../core/services/user/user.service';
import { ChatUser } from '../../../../core/models/user.class';
import { Channel } from '../../../../core/models/channel.class';
import { LayoutService } from '../../../../core/services/layout/layout.service';

@Component({
    selector: 'app-new-message',
    imports: [MessageTextareaComponent, CommonModule],
    templateUrl: './new-message.component.html',
    styleUrl: './new-message.component.scss'
})
export class NewMessageComponent {
  @ViewChild('input') inputElement!: ElementRef;
  @ViewChild('textarea') textArea!: ElementRef;

  @HostListener('window:resize')
  setValuePlaceholder(): void {
    if (window.innerWidth < 768) {
      this.inputElement.nativeElement.placeholder =
        'An: #channel, oder @jemand';
    } else {
      this.inputElement.nativeElement.placeholder =
        'An: #channel, oder @jemand oder E-Mail Adresse';
    }
  }

  ngAfterViewInit(): void {
    // Setze den Platzhalter sofort, wenn die Ansicht fertig ist
    this.setValuePlaceholder();
  }

  constructor(
    public sideNavService: SideNavService,
    public chatService: ChatService,
    public userService: UserService,
    public layoutService: LayoutService
  ) {}
  
  filteredUsers: any[] = [];
  searchQuery: string = '';
  selectedUserAvatar?: any = '';
  selectedUser?: any = '';
  selectedChannel?: any = '';
  divForSelectedElement: boolean = false;
  type: string = 'directMessage';

  changeType(type: string): void {
    this.type = type;
  }

  updateSearchQuery(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.searchQuery = inputElement.value;
    const dropDown = document.getElementById('searchResultsDropdown2');

    if (this.searchQuery.includes('#') || this.searchQuery.includes('@')) {
      this.filterResults();
      dropDown?.classList.remove('dNone');
    }
    if (this.inputElement.nativeElement.value === '') {
      dropDown?.classList.add('dNone');
    }
  }

  async filterResults() {
    this.filteredUsers = [];
    const query = this.searchQuery.toLowerCase();
    let users: ChatUser[] = [];
    let channels: Channel[] = [];

    users = query.startsWith('@')
      ? this.userService
          .allUsers()
          .filter((user) =>
            user.name.toLowerCase().includes(query.substring(1))
          )
      : this.userService
          .allUsers()
          .filter((user) => user.email.toLowerCase().includes(query));

    if (query.startsWith('#')) {
      channels = this.chatService
        .channels()
        .filter((channel) =>
          channel.name.toLowerCase().includes(query.substring(1))
        );
    }

    this.filteredUsers = [...users, ...channels];
  }

  selectUserOrChannel(id: string) {
    const selectedUser = this.userService
      .allUsers()
      ?.find((user) => user.userUID === id);
    if (selectedUser) {
      this.chatService.contactUUID = selectedUser.userUID;
      this.selectedUserAvatar = selectedUser.avatar;
      this.selectedUser = selectedUser.name;
      this.changeType('directMessage');
    } else {
      this.selectedUserAvatar = null;
      this.selectedUser = null;
    }

    const selectedChannel = this.chatService
      .channels()
      ?.find((channel) => channel.id === id);
    if (selectedChannel) {
      this.selectedChannel = selectedChannel.name;
      this.changeType('chat');
      this.chatService.channelID = id;
      this.chatService.changeChannelWithoutNavigation(selectedChannel.id);
    } else {
      this.selectedChannel = null;
    }

    if (this.inputElement?.nativeElement) {
      this.inputElement.nativeElement.value = '';
      this.inputElement.nativeElement.placeholder = '';
      this.inputElement.nativeElement.disabled = true;
    }

    this.divForSelectedElement = !!this.selectedUser || !!this.selectedChannel;
  }

  deleteDiv() {
    this.selectedUser = null;
    this.selectedUserAvatar = null;
    this.selectedChannel = null;
    this.inputElement.nativeElement.disabled = false;
    this.inputElement.nativeElement.placeholder =
      'An: #channel, oder @jemand oder E-Mail Adresse';
    this.divForSelectedElement = false;
  }
}

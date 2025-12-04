import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { SideNavService } from '../../core/services/sideNav/side-nav.service';
import { ChatUser } from '../../core/models/user.class';
import { UserService } from '../../core/services/user/user.service';
import { CommonModule } from '@angular/common';
import { ChatService } from '../../core/services/chat/chat.service';
import { LayoutService } from '../../core/services/layout/layout.service';

@Component({
    selector: 'app-filter-name',
    imports: [CommonModule],
    templateUrl: './filter-name.component.html',
    styleUrl: './filter-name.component.scss'
})
export class FilterNameComponent {
  
  constructor(public sideNavService: SideNavService, public userService: UserService, public chatService: ChatService, public layoutService: LayoutService) {}
  
  showedAllUsers: boolean = false;
  filteredUsers: ChatUser[] = [];
  arrayOfChosenContacts: ChatUser[] = [];
  userUIDs: string[] = [];
  contactsChosen: boolean = false;
  notAddedSpecificPeopleToTheChannel: boolean = false;
  addedUsers: boolean = false;
  @Input('isInChat') isInChat: boolean = false;
  @ViewChild('addName') addName!: ElementRef;

  ngAfterViewInit() {
    this.searchUsers(this.addName.nativeElement);
  }
  
  selectUser(userUID: string) {
    this.removeUser(userUID);
    const selectedUserIndex = this.userService
      .allUsers()
      .findIndex((user) => user.userUID === userUID);
    const selectedUser = this.userService.allUsers()[selectedUserIndex];
    this.arrayOfChosenContacts.push(selectedUser);
    this.chatService.updateChosenUserUIDs(this.arrayOfChosenContacts.map(contact => contact.userUID));
    this.contactsChosen = true;
    this.notAddedSpecificPeopleToTheChannel = false;
    this.showedAllUsers = false;
  }

  removeUser(userUID: string) {
    const index = this.filteredUsers.findIndex(
      (user) => user.userUID === userUID
    );
    if (index !== -1) {
      this.filteredUsers.splice(index, 1);
    }
  }

  showAllUsers() {
    this.showedAllUsers = true;
  }

  isUserInCurrentChannel(user: ChatUser) {
    if (this.isInChat) {
      return this.chatService.currentChannel().userUIDs.includes(user.userUID);
    } else {
      return false;
    }
  }

  searchUsers(input: HTMLInputElement) {
    const filteredUsers = this.userService
      .allUsers()
      .filter((user) => user.name.toLowerCase().includes(input.value.toLowerCase()));

    this.filteredUsers = filteredUsers.filter(user => !this.arrayOfChosenContacts.includes(user) && !this.isUserInCurrentChannel(user) && !(this.userService.currentOnlineUser().userUID === user.userUID));
  }

  deleteUserFromArrayOfChosenContacts(userUID: string) {
    const indexOfUser = this.arrayOfChosenContacts.findIndex(
      (user) => user.userUID === userUID
    );
    this.arrayOfChosenContacts.splice(indexOfUser, 1);
    this.chatService.updateChosenUserUIDs(this.arrayOfChosenContacts.map(contact => contact.userUID));
    const i = this.userService
      .allUsers()
      .findIndex((user) => user.userUID === userUID);
    this.filteredUsers.push(this.userService.allUsers()[i]);
    this.filteredUsers.push();
    if (this.arrayOfChosenContacts.length === 0) {
      this.addedUsers = false;
    }
  }
}

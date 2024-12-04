import { Component, ElementRef, ViewChild } from '@angular/core';
import { SideNavService } from '../../../../core/services/sideNav/side-nav.service';
import { ChatService } from '../../../../core/services/chat/chat.service';
import { UserService } from '../../../../core/services/user/user.service';
import { Channel } from '../../../../core/models/channel.class';
import { collection, doc, setDoc } from 'firebase/firestore';
import { FirebaseService } from '../../../../core/services/firebase/firebase.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatUser } from '../../../../core/models/user.class';
import { FilterNameComponent } from '../../../../shared/filter-name/filter-name.component';

@Component({
  selector: 'app-create-channel',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterNameComponent],
  templateUrl: './create-channel.component.html',
  styleUrl: './create-channel.component.scss',
})
export class CreateChannelComponent {
  constructor(
    public sideNavService: SideNavService,
    public chatService: ChatService,
    public userService: UserService,
    public fireBaseService: FirebaseService
  ) {}

  userUIDs: string[] = [];
  channelId: string = '';
  AddSpecificPeople: boolean = false;
  selectMembersFromDevspace: boolean = true;
  selectSpecificMembers: boolean = false;
  inputsAreEmpty: boolean = true;
  channelName: string = '';
  description: string = '';
  notAddedSpecificPeopleToTheChannel: boolean = false;
  addedPeopleToTheChannel: string = '';
  selectedUser: object = [];
  showedAllUsers: boolean = false;
  contactsChosen: boolean = false;
  arrayOfChosenContacts: ChatUser[] = [];
  filteredUsers: ChatUser[] = JSON.parse(
    JSON.stringify(this.userService.allUsers())
  );
  addedUsers: boolean = false;
  id: string = "addName";
  mobile: boolean = false;
  @ViewChild('input') inputRef!: ElementRef;

  onDiv1Click(): void {
    this.sideNavService.createChannelsDivOpened = false;
    this.chatService.updateChosenUserUIDs([]);
  }

  async createChannel() {
    let channelName: HTMLInputElement = document.getElementById(
      'input1'
    ) as HTMLInputElement;
    let description: HTMLInputElement = document.getElementById(
      'input2'
    ) as HTMLInputElement;

    if (this.selectMembersFromDevspace) {
      this.addAllMembersFromDevspace();
    }

    if (this.chatService.chosenUserUIDs().length > 0) {
      this.addSpecificUsersToTheUserUID();
    }

    let channel = new Channel(
      this.chatService.contactIndex,
      channelName.value,
      description.value,
      this.userUIDs,
      this.userService.currentOnlineUser().name
    );

    this.channelId = doc(
      collection(this.fireBaseService.firestore, 'channels')
    ).id;

    this.sideNavService.addChannel(channel);

    await setDoc(
      doc(this.fireBaseService.firestore, 'channels', this.channelId),
      {
        name: channelName.value,
        description: description.value,
        createdBy: this.userService.currentOnlineUser().name,
        userUIDs: this.userUIDs,
      }
    );
    this.chatService.openChannel(this.channelId);

    const addPeopleDiv: HTMLElement = document.getElementById(
      'addPeople'
    ) as HTMLElement;
    addPeopleDiv.style.display = 'flex';
    const createChannelDiv: HTMLElement = document.getElementById(
      'createChannel'
    ) as HTMLElement;
    createChannelDiv.style.display = 'none';

    this.onDiv1Click();
  }

  addMembersFromDevspace() {
    this.selectMembersFromDevspace = true;
    this.selectSpecificMembers = false;
    this.AddSpecificPeople = false;
    this.notAddedSpecificPeopleToTheChannel = false;

    this.closeUsersWindow();
  }

  chooseSpecificMembers() {
    this.selectSpecificMembers = true;
    this.selectMembersFromDevspace = false;
    this.AddSpecificPeople = true;
    this.notAddedSpecificPeopleToTheChannel = true;
  }

  addSpecificUsersToTheUserUID() {
    this.userUIDs = [];
    this.chatService.chosenUserUIDs().forEach((userUID) => {
      this.userUIDs.push(userUID);
    });
    this.userUIDs.push(this.userService.currentOnlineUser().userUID);
  }

  addPeople() {
    const section1: HTMLDivElement = document.getElementById(
      'createChannel'
    ) as HTMLDivElement;
    const section2: HTMLDivElement = document.getElementById(
      'addPeople'
    ) as HTMLDivElement;

    if (window.innerWidth > 768) {
      this.mobile = false;
      section1.style.display = 'none';
      section2.classList.remove('dNone');
    } else {
      this.mobile = true;
      section2.classList.remove('dNone');
      section1.style.display = 'flex';
      section2.classList.add('fade-in-from-down');
    }
  }

  channelNameExist: boolean = false;

  checkInputs() {
    this.channelNameExist = false;
    this.inputRef.nativeElement.classList.remove('channel-exists');
    this.inputRef.nativeElement.placeholder = "z.B. Kooperationsprojekte";
    if (this.channelName === '') {
      this.inputsAreEmpty = true;
    } else {
      this.inputsAreEmpty = false;
      this.chatService.channels().forEach(channel => {
        if(channel.name == this.channelName){
          this.channelNameExist = true;
          this.inputsAreEmpty = true;
        }
      });
    }
  }

  checkIfPeopleAddedToTheChannel() {
    if (this.addedPeopleToTheChannel == '') {
      this.notAddedSpecificPeopleToTheChannel = true;
    } else {
      this.notAddedSpecificPeopleToTheChannel = false;
    }
  }

  showAllUsers() {
    this.showedAllUsers = true;
  }

  closeUsersWindow(): void {
    this.showedAllUsers = false;
  }

  addAllMembersFromDevspace() {
    this.userUIDs = [];
    this.userService.allUsers().forEach((user) => {
      this.userUIDs.push(user.userUID);
    });
  }

  removeUserFromList(userID: object, $index: number) {
    const user = document.getElementById('user' + $index);
    user!.style.display = 'none';
  }

  closeWindowWithContacts() {
    this.showedAllUsers = false;
    this.addedUsers = false;
  }

  showChosenUsers() {
    this.addedUsers = !this.addedUsers;
  }

  closeDiv(id: string) {
    let div = document.getElementById(id);
    div!.classList.add('dNone');
  }
}

import { Component, ElementRef, inject, Input, ViewChild } from '@angular/core';
import { FormControl, FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user/user.service';

import { SideNavService } from '../../../core/services/sideNav/side-nav.service';
import { ChatService } from '../../../core/services/chat/chat.service';
import { FirebaseService } from '../../../core/services/firebase/firebase.service';
import {
  collectionGroup,
  getDoc,
  onSnapshot,
  query,
  Unsubscribe,
  where,
} from '@angular/fire/firestore'
import { directMessage } from '../../../core/models/direct-message';

@Component({
    selector: 'app-search-component',
    imports: [FormsModule, ReactiveFormsModule],
    templateUrl: './search-component.component.html',
    styleUrl: './search-component.component.scss'
})
export class SearchComponentComponent {
  public userService = inject(UserService);
  public sideNavService = inject(SideNavService);
  public chatService = inject(ChatService);
  public fireBaseService = inject(FirebaseService);
  searchQuery: string = '';
  filteredResults: any[] = [];
  filteredChannels: any[] = [];
  messages: directMessage[] = [];
  showDropDown: boolean = false;
  searchComponentInputControl = new FormControl('');

  @Input('placeholder') placeholder: string = 'Suchen...';

  @ViewChild('searchComponentInput') inputRef!: ElementRef;
  @ViewChild('dropDownMenu') dropDownMenu!: ElementRef;

  unsubMessages!: Unsubscribe

  constructor() {
    this.unsubMessages = this.getDirectMessages();
  }

  ngOnDestroy() {
    this.unsubMessages();
  }

  resetInput() {
    this.searchComponentInputControl.reset();
    this.showDropDown = false;
  }
 
  updateSearchQuery(value: string) {
    this.searchQuery = value;
    if (value === "") {
      this.showDropDown = false;
    } else {
      this.showDropDown = true;
      this.filterResults();
    }
  }

  async filterResults() {
    this.filteredResults = [];
    const query = this.searchQuery.toLowerCase();

    const filteredUsers = this.userService
      .allUsers()
      .filter((user) => user.name.toLowerCase().includes(query));

    const filteredChannels = this.chatService
      .channels()
      .filter((channel) => channel.name.toLowerCase().includes(query));

    const filteredDirectMessages = this.messages.filter((message) =>
      message.message.toLowerCase().includes(query)
    );

    this.filteredResults = [
      ...filteredUsers,
      ...filteredChannels,
      ...filteredDirectMessages,
    ];
  }

  getDirectMessages() {

    const messagesRef = collectionGroup(
      this.fireBaseService.firestore,
      'messages'
    );

    const q = query(messagesRef, where('content', '!=', null));

    return onSnapshot(q, (querySnapshot) => {

      querySnapshot.forEach(async (doc) => {
        const docData = doc.data();
        const messagesCollectionRef = doc.ref.parent;
        const directMessageChannelsDocRef = messagesCollectionRef.parent;

        if (directMessageChannelsDocRef) {
          const directMessageChannelDoc = await getDoc(
            directMessageChannelsDocRef
          );
          const directMessageChannelDocData = directMessageChannelDoc.data();
          const userIds: string[] = directMessageChannelDocData!['userIds'];
          const messageObject = new directMessage(
            directMessageChannelDoc.id,
            userIds,
            docData['content']
          );
          this.messages.push(messageObject);
        }
      });
    });
  }
}

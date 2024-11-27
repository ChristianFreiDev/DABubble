import {
  computed,
  Injectable,
  Signal,
  signal,
} from '@angular/core';
import { Message } from '../../models/message.class';
import { MessageInterface } from '../../models/message.interface';
import {
  addDoc,
  DocumentSnapshot,
  onSnapshot,
  orderBy,
  query,
  QueryDocumentSnapshot,
  Unsubscribe,
  updateDoc,
  setDoc,
} from '@angular/fire/firestore';
import { FirebaseService } from '../firebase/firebase.service';
import { Channel } from '../../models/channel.class';
import { ChannelName } from '../../models/channel-name.interface';
import { ChannelDescription } from '../../models/channel-description.interface';
import { UserService } from '../user/user.service';
import { ChannelUserUIDsInterface } from '../../models/channel-user-uids.interface';
import { ChatUser } from '../../models/user.class';
import { EmptyMessageFile } from '../../models/empty-message-file.interface';
import { LayoutService } from '../layout/layout.service';
import { EventService } from '../event/event.service';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  contactIndex: number | any = null;
  currentUser: any;
  userAvatar: string = '';
  contactUUID: string = '';
  profileViewUsersActive: boolean = false;
  public isLoadingMessages = signal<boolean>(false);

  unsubMessages!: Unsubscribe;
  unsubDirectMessages!: Unsubscribe;
  unsubChannels!: Unsubscribe;
  unsubDirectMessageChannels!: Unsubscribe;
  unsubThread!: Unsubscribe;
  unsubTopThreadMessage!: Unsubscribe;

  public messagesSignal = signal<Message[]>([]);
  readonly messages = this.messagesSignal.asReadonly();

  private directMessagesSignal = signal<Message[]>([]);
  readonly directMessages = this.directMessagesSignal.asReadonly();

  private topThreadMessageSignal = signal<Message>(new Message());
  readonly topThreadMessage = this.topThreadMessageSignal.asReadonly();

  private threadRepliesSignal = signal<Message[]>([]);
  readonly threadReplies = this.threadRepliesSignal.asReadonly();

  private currentChannelSignal = signal<Channel>(new Channel());
  readonly currentChannel = this.currentChannelSignal.asReadonly();

  private currentDirectMessageChannelSignal = signal<Channel>(new Channel());
  readonly currentDirectMessageChannel =
    this.currentDirectMessageChannelSignal.asReadonly();

  private usersInCurrentChannelSignal = signal<ChatUser[]>([]);
  readonly usersInCurrentChannel =
    this.usersInCurrentChannelSignal.asReadonly();

  private usersInCurrentChannelWithoutCurrentUserSignal: Signal<ChatUser[]> =
    computed(() =>
      this.usersInCurrentChannel().filter(
        (user) => user.userUID !== this.userService.currentOnlineUser().userUID
      )
    );
  readonly usersInCurrentChannelWithoutCurrentUser =
    this.usersInCurrentChannelWithoutCurrentUserSignal;

  private channelsSignal = signal<Channel[]>([]);
  readonly channels = this.channelsSignal.asReadonly();

  readonly myChannels = computed(() => this.channels().filter(channel => channel.userUIDs.includes(this.userService.currentOnlineUser().userUID)));

  private directMessageChannelsSignal = signal<Channel[]>([]);
  readonly directMessageChannels =
    this.directMessageChannelsSignal.asReadonly();

  private chosenUserUIDsSignal = signal<string[]>([]);
  readonly chosenUserUIDs = this.chosenUserUIDsSignal.asReadonly();

  topThreadMessageId: string = '';

  profileViewLoggedUser: boolean = false;
  myChatDescription: boolean = false;
  chatDescription: boolean = false;
  contacts: any = [];
  channelID: string = '';
  private selectedChannelId: string | null = null;

  private currentMainChatCollectionSignal = computed(() =>
    this.layoutService.selectedCollection()
  );

  constructor(
    private firebaseService: FirebaseService,
    private userService: UserService,
    private layoutService: LayoutService,
    private eventService: EventService
  ) {
    this.unsubChannels = this.subChannels();
    this.unsubDirectMessageChannels = this.subDirectMessageChannels();
  }

  ngOnDestroy() {
    this.unsubMessages();
    this.unsubDirectMessages();
    this.unsubChannels();
    this.unsubDirectMessageChannels();
    if (this.unsubThread) {
      this.unsubThread();
    }
    if (this.unsubTopThreadMessage) {
      this.unsubTopThreadMessage();
    }
  }

  createMessageFromDocumentSnapshot(
    doc: QueryDocumentSnapshot | DocumentSnapshot
  ) {
    const data = doc.data();
    if (data) {
      const reactions = JSON.parse(data['reactions']);
      const postedAt = new Date(data['postedAt']);
      const lastReplyAt = new Date(data['lastReplyAt']);
      const message = new Message(
        doc.id,
        data['imageName'],
        data['userName'],
        postedAt,
        lastReplyAt,
        data['content'],
        reactions,
        data['numberOfReplies'],
        data['fileUrl'],
        data['fileType'],
        data['fileName'],
        data['senderId']
      );
      return message;
    } else {
      return undefined;
    }
  }

  clearThread() {
    this.threadRepliesSignal.set([]);
  }

  async addDirectMessageChannel() {
    const dmChannelId = this.getDirectMessageChannelId(this.contactUUID);
    await setDoc(
      this.firebaseService.getDocRef(dmChannelId, 'directMessageChannels'),
      {
        id: dmChannelId,
        userIds: [
          this.contactUUID,
          this.userService.currentOnlineUser().userUID,
        ],
      }
    );
  }

  async addChatMessage(
    messageContent: string,
    fileUrl: string,
    fileType: string,
    fileName: string
  ) {
    const messageAsJson = this.prepareMessageForDatabase(
      messageContent,
      fileUrl,
      fileType,
      fileName
    );
    await addDoc(
      this.firebaseService.getSubcollectionRef(
        this.currentChannel().id,
        'channels',
        'messages'
      ),
      messageAsJson
    );
  }

  getDirectMessageChannelId(userUID: any) {
    if(userUID.length > 30) {
      return userUID;
    }
    let ids = [this.userService.currentOnlineUser().userUID, userUID];
    const sortedIds = ids.sort();
    return sortedIds[0] + sortedIds[1];
  }

  async addDirectMessage(
    messageContent: string,
    fileUrl: string,
    fileType: string,
    fileName: string
  ) {
    await this.addDirectMessageChannel();
    const messageAsJson = this.prepareMessageForDatabase(
      messageContent,
      fileUrl,
      fileType,
      fileName
    );
    await addDoc(
      this.firebaseService.getSubcollectionRef(
        this.getDirectMessageChannelId(this.contactUUID),
        'directMessageChannels',
        'messages'
      ),
      messageAsJson
    );
    this.changeDirectMessageChannel(this.contactUUID);
  }

  getMainChatChannelId() {
    return this.currentMainChatCollectionSignal() === 'channels'
      ? this.currentChannel().id
      : this.currentDirectMessageChannel().id;
  }

  async addThreadReply(
    messageContent: string,
    fileUrl: string,
    fileType: string,
    fileName: string
  ) {
    const messageAsJson = this.prepareMessageForDatabase(
      messageContent,
      fileUrl,
      fileType,
      fileName
    );
    await addDoc(
      this.firebaseService.getSubSubcollectionRef(
        this.currentMainChatCollectionSignal(),
        this.getMainChatChannelId(),
        'messages',
        this.topThreadMessage().id,
        'thread'
      ),
      messageAsJson
    );
    await this.increaseNumberOfReplies(this.currentMainChatCollectionSignal());
  }

  async updateChannel(
    channelObj: ChannelName | ChannelDescription | ChannelUserUIDsInterface
  ) {
    await updateDoc(
      this.firebaseService.getDocRef(this.currentChannel().id, 'channels'),
      { ...channelObj }
    );
  }

  async updateChatMessage(
    messageId: string,
    messageObj: any | EmptyMessageFile
  ) {
    await updateDoc(
      this.firebaseService.getDocRefInSubcollection(
        this.currentChannel().id,
        'channels',
        'messages',
        messageId
      ),
      { ...messageObj }
    );
  }

  async updateDirectMessage(messageId: string, messageObj: any) {
    await updateDoc(
      this.firebaseService.getDocRefInSubcollection(
        this.currentDirectMessageChannel().id,
        'directMessageChannels',
        'messages',
        messageId
      ),
      { ...messageObj }
    );
  }

  async updateThreadReply(
    replyId: string,
    messageObj: MessageInterface | EmptyMessageFile | any
  ) {
    await updateDoc(
      this.firebaseService.getDocRefInSubSubcollection(
        'channels',
        this.currentChannel().id,
        'messages',
        this.topThreadMessage().id,
        'thread',
        replyId
      ),
      { ...messageObj }
    );
  }

  async subMessages(channelId: string) {
    const q = query(
      this.firebaseService.getSubcollectionRef(
        channelId,
        'channels',
        'messages'
      ),
      orderBy('postedAt')
    );
    return onSnapshot(q, (snapshot) => {
      const tempMessages: Message[] = [];
      snapshot.forEach((doc) => {
        const message = this.createMessageFromDocumentSnapshot(doc);
        if (message) {
          tempMessages.push(message);
        }
      });
      this.messagesSignal.set(tempMessages);
      this.isLoadingMessages.set(false);
    });
  }

  subDirectMessages(directMessageChannelId: string) {
    const q = query(
      this.firebaseService.getSubcollectionRef(
        directMessageChannelId,
        'directMessageChannels',
        'messages'
      ),
      orderBy('postedAt')
    );
    return onSnapshot(q, (snapshot) => {
      const tempMessages: Message[] = [];
      snapshot.forEach((doc) => {
        const message = this.createMessageFromDocumentSnapshot(doc);
        if (message) {
          tempMessages.push(message);
        }
      });
      this.directMessagesSignal.set(tempMessages);
      this.isLoadingMessages.set(false);
    });
  }

  createChannelFromQueryDocumentSnapshot(doc: QueryDocumentSnapshot) {
    const data = doc.data();
    const channel = new Channel(
      doc.id,
      data['name'],
      data['description'],
      data['userUIDs'],
      data['createdBy']
    );
    return channel;
  }

  createDirectMessageChannelFromQueryDocumentSnapshot(
    doc: QueryDocumentSnapshot
  ) {
    const data = doc.data();
    const channel = new Channel(doc.id, data['userUIDs']);
    return channel;
  }

  subChannels() {
    return onSnapshot(
      this.firebaseService.getCollectionRef('channels'),
      async (collection) => {
        const channels: Channel[] = [];
        collection.forEach((doc) => {
          const channel = this.createChannelFromQueryDocumentSnapshot(doc);
          channels.push(channel);
        });
        this.channelsSignal.set(channels);
        if (!this.unsubMessages && this.myChannels()[0]) {
          this.currentChannelSignal.set(this.myChannels()[0]);
          this.unsubMessages = await this.subMessages(this.currentChannel().id);
          this.openChannel(this.currentChannel().id);
        } else if (!(this.myChannels().length === 0)) {
          this.openChannel(this.currentChannel().id);
        } else {
          this.layoutService.selectNewMessage();
        } 
        this.getUsersInCurrentChannel();
      });
  }

  subDirectMessageChannels() {
    return onSnapshot(
      this.firebaseService.getCollectionRef('directMessageChannels'),
      (collection) => {
        const channels: Channel[] = [];
        collection.forEach((doc) => {
          const channel =
            this.createDirectMessageChannelFromQueryDocumentSnapshot(doc);
          channels.push(channel);
        });
        this.directMessageChannelsSignal.set(channels);
        if (!this.unsubDirectMessages && this.directMessageChannels()[0]) {
          this.currentDirectMessageChannelSignal.set(
            this.directMessageChannels()[0]
          );
          this.unsubDirectMessages = this.subDirectMessages(
            this.currentDirectMessageChannel().id
          );
        } else {
          this.changeDirectMessageChannel(this.contactUUID);
        }
        this.getUsersInCurrentChannel();
      });
  }

  resubThread() {
    if (this.unsubThread) {
      this.unsubThread();
    }
    this.unsubThread = this.subThread();
  }

  changeThread(message: Message) {
    this.topThreadMessageId = message.id;
    this.resubThread();
    this.unsubTopThreadMessage = this.subTopThreadMessage(
      this.currentMainChatCollectionSignal()
    );
  }

  async resubChannel() {
    if (this.unsubMessages) {
      this.unsubMessages();
    }
    this.unsubMessages = await this.subMessages(this.currentChannel().id);
    this.getUsersInCurrentChannel();
  }

  resubDirectMessageChannel() {
    if (this.unsubDirectMessages) {
      this.unsubDirectMessages();
    }
    this.unsubDirectMessages = this.subDirectMessages(
      this.currentDirectMessageChannel().id
    );
  }

  getSelectedChannelId(): string | null {
    return this.selectedChannelId;
  }

  changeChannelWithoutNavigation(id: string) {
    this.selectedChannelId = id;
    this.isLoadingMessages.set(true);
    const index = this.channels().findIndex((channel) => channel.id === id);

    if (index !== -1) {
      this.currentChannelSignal.set(this.channels()[index]);
      this.resubChannel();
    } else {
      this.messagesSignal.set([]);
      this.isLoadingMessages.set(false);
    }
    this.eventService.triggerFocusEvent();
  }

  openChannel(id: string) {
    this.changeChannelWithoutNavigation(id);
    this.layoutService.deselectSideNavOnMobile();
    this.layoutService.selectThread(false);
    this.layoutService.selectChat();
  }

  changeDirectMessageChannel(id: any) {
    this.isLoadingMessages.set(true);
    const directMessageChannelId = this.getDirectMessageChannelId(id);
    const index = this.directMessageChannels().findIndex(
      (channel) => channel.id === directMessageChannelId
    );

    if (index !== -1) {
      this.currentDirectMessageChannelSignal.set(
        this.directMessageChannels()[index]
      );
      this.resubDirectMessageChannel();
    } else {
      this.directMessagesSignal.set([]);
      this.isLoadingMessages.set(false);
    }
    this.eventService.triggerFocusEvent();
  }

  leaveChannel() {
    if (
      this.currentChannel().userUIDs &&
      this.currentChannel().userUIDs.length > 0
    ) {
      const newuserUIDs = this.currentChannel().userUIDs.filter(
        (userUID) => userUID !== this.userService.currentOnlineUser().userUID
      );
      this.updateChannel({
        userUIDs: newuserUIDs,
      });
      if (this.myChannels().length > 1) {
        setTimeout(() => {
          this.openChannel(this.myChannels()[0].id);
        }, 1);
      }
    }
  }

  getUsersInCurrentChannel() {
    const foundUsers: ChatUser[] = [];
    if (
      this.currentChannel().userUIDs &&
      this.currentChannel().userUIDs.length > 0
    ) {
      this.currentChannel().userUIDs.forEach((userUID) => {
        const foundUser = this.userService
          .allUsers()
          .find((user) => userUID === user.userUID);
        if (foundUser) {
          foundUsers.push(foundUser);
        }
      });
    }
    this.usersInCurrentChannelSignal.set(foundUsers);
  }

  async addPersonToCurrentChannel(userUID: string) {
    if (!this.currentChannel().userUIDs.includes(userUID)) {
      await this.updateChannel({
        userUIDs: [...this.currentChannel().userUIDs, userUID],
      });
    }
  }

  findUserInAllUsers(name: string): ChatUser[] {
    return this.userService
      .allUsers()
      .filter((user) => user.name.toLowerCase().includes(name.toLowerCase()));
  }

  findUsersToAdd(name: string): ChatUser[] {
    const users = this.findUserInAllUsers(name);
    return users.filter((user) => !this.usersInCurrentChannel().includes(user));
  }

  async increaseNumberOfReplies(collection: string) {
    this.topThreadMessage().numberOfReplies++;
    this.topThreadMessage().lastReplyAt = new Date();
    if (collection === 'channels') {
      this.updateChatMessage(
        this.topThreadMessage().id,
        this.topThreadMessage().toJson()
      );
    } else {
      this.updateDirectMessage(
        this.topThreadMessage().id,
        this.topThreadMessage().toJson()
      );
    }
  }

  prepareMessageForDatabase(
    messageContent: string,
    fileUrl: string,
    fileType: string,
    fileName: string
  ): MessageInterface {
    const message = new Message(
      '',
      this.userService.currentOnlineUser().avatar,
      this.userService.currentOnlineUser().name,
      new Date(),
      new Date(),
      messageContent,
      [],
      0,
      fileUrl,
      fileType,
      fileName,
      this.userService.currentOnlineUser().userUID
    );
    return message.toJson();
  }

  openChatOrChannel(result: any) {
    if(result.id.length > 28) {
      this.openChat(result.userIds);
    } else {
      this.openChannel(result.id);
    }
  }

  openChat(userUID: string): void {
    let stringUserUID: string = "";
    let arrayUserUID: string[] = [];
    if(Array.isArray(userUID)) {
      arrayUserUID = userUID;
      let onlineUserIndex: number;
      arrayUserUID.forEach((uid, currentIndex) => {
        if(uid == this.userService.currentOnlineUser().userUID) {
          onlineUserIndex = currentIndex;
          arrayUserUID.forEach((uid, index) => {
            if(index !== onlineUserIndex) {
              stringUserUID = uid;
            }
          });
        }
      })
    } else {
      stringUserUID = userUID;
    }
    this.contactUUID = stringUserUID;
    this.currentUser = this.userService
      .allUsers()
      .find((user) => user.userUID == stringUserUID);
    this.contactIndex = this.userService
      .allUsers()
      .findIndex((user) => user.userUID == stringUserUID);
    if (
      this.currentUser?.userUID === this.userService.currentOnlineUser().userUID
    ) {
      this.myChatDescription = true;
      this.chatDescription = false;
    } else {
      this.myChatDescription = false;
      this.chatDescription = true;
    }
    this.layoutService.deselectSideNavOnMobile();
    this.layoutService.selectThread(false);
    this.layoutService.selectDirectMessage();
    const channelElements = document.querySelectorAll('.entwicklerTeam');
    channelElements.forEach((element) => {
      element.classList.remove('channelWasChosen');
    });
    this.selectedChannelId = null;
    this.changeDirectMessageChannel(stringUserUID);
  }

  subThread() {
    const q = query(
      this.firebaseService.getSubSubcollectionRef(
        this.currentMainChatCollectionSignal(),
        this.getMainChatChannelId(),
        'messages',
        this.topThreadMessageId,
        'thread'
      ),
      orderBy('postedAt')
    );
    return onSnapshot(q, (snapshot) => {
      const tempMessages: any[] = [];
      snapshot.forEach((doc) => {
        const message = this.createMessageFromDocumentSnapshot(doc);
        if (message) {
          tempMessages.push(message);
        }
      });
      this.threadRepliesSignal.set(tempMessages);
    });
  }

  subTopThreadMessage(collection: string) {
    return onSnapshot(
      this.firebaseService.getDocRefInSubcollection(
        this.getMainChatChannelId(),
        collection,
        'messages',
        this.topThreadMessageId
      ),
      (doc) => {
        if (doc) {
          const message = this.createMessageFromDocumentSnapshot(doc);
          if (message) {
            this.topThreadMessageSignal.set(message);
          }
        }
      }
    );
  }

  setContactIndexFromUID(userUID: string) {
    const userIndex = this.userService
      .allUsers()
      .findIndex((user) => user.userUID === userUID);
    if (userIndex !== -1) {
      this.contactIndex = userIndex;
    }
  }

  openViewProfile(userUID: string) {
    if (userUID == this.userService.currentOnlineUser().userUID) {
      this.profileViewLoggedUser = true;
    } else {
      if (!this.contactIndex) {
        this.setContactIndexFromUID(userUID);
      }
      this.profileViewUsersActive = true;
    }
  }

  isChatUser(option: ChatUser | Channel) {
    if (option instanceof ChatUser) {
      return true;
    } else {
      return false;
    }
  }

  deleteFile(messageId: string, type: string) {
    const emptyFileData = {
      fileUrl: '',
      fileType: '',
      fileName: '',
    };
    if (messageId) {
      if (type === 'chat') {
        this.updateChatMessage(messageId, emptyFileData);
      } else if (type === 'thread') {
        this.updateThreadReply(messageId, emptyFileData);
      } else if (type === 'directMessage') {
        this.updateDirectMessage(messageId, emptyFileData);
      }
    }
  }

  closeDropDownMenu() {
    const dropDownDiv = document.getElementById('searchResultsDropdown');
    dropDownDiv?.classList.add('dNone');
    const dropDownDiv2 = document.getElementById('searchResultsDropdown2');
    dropDownDiv2?.classList.add('dNone');
  }

  updateChosenUserUIDs(userUIDs: string[]) {
    this.chosenUserUIDsSignal.set(userUIDs);
  }
}

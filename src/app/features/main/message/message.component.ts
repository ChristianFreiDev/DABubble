import { Component, computed, ElementRef, EventEmitter, Input, Output, Signal, ViewChild } from '@angular/core';
import { Message } from '../../../core/models/message.class';
import { CommonModule } from '@angular/common';
import { ChatService } from '../../../core/services/chat/chat.service';
import { Reaction } from '../../../core/models/reaction.class';
import { UserService } from '../../../core/services/user/user.service';
import { FormsModule } from '@angular/forms';
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';
import { ReactionOptionsComponent } from './reaction-options/reaction-options.component';
import { DeletableFileComponent } from '../deletable-file/deletable-file.component';
import { LayoutService } from '../../../core/services/layout/layout.service';
import { FirebaseService } from '../../../core/services/firebase/firebase.service';
import { DialogService } from '../../../core/services/dialog/dialog.service';

@Component({
    selector: 'app-message',
    imports: [EmojiPickerComponent, ReactionOptionsComponent, DeletableFileComponent, CommonModule, FormsModule],
    templateUrl: './message.component.html',
    styleUrl: './message.component.scss'
})
export class MessageComponent {
  @Input() messageData: Message = new Message();
  @Input() type: string = 'chat';
  isThreadMessage: boolean = false;
  @Input() isTopMessage: boolean = false;
  menuEmojis: Signal<string[]> = this.dialogService.lastEmojis;
  reactionOptions: Signal<string[]> = computed(() => ['1f64c.svg', '1f642.svg', '1f680.svg', '1f913.svg', '2705.svg'].filter(emoji => !this.menuEmojis().includes(emoji)));
  replies: Signal<Message[]> = this.chatService.threadReplies;
  isMe: boolean = false;
  isMoreMenuOpen: boolean = false;
  areReactionOptionsOpen: boolean = false;
  areSecondaryReactionOptionsOpen: boolean = false;
  isMessageBeingEdited: boolean = false;
  editMessageText: string = '';
  isEmojiPickerForEditingVisible: Signal<boolean> = this.dialogService.openEmojiPickerForEditing;
  fileRemoved: boolean = false;
  deleteFileWhenSavingMessage: boolean = true;
  isHighlightingMessage: boolean = false;
  touchMessageTimeout!: ReturnType<typeof setTimeout>;
  tapDurationInMilliseconds: number = 100;
  @ViewChild('messageContainer') messageContainer!: ElementRef;
  @Output() messageSelectionEvent = new EventEmitter<string>;
  userName() {
    return this.userService.allUsersMap().get(this.messageData.senderId)?.name;
  }
  userAvatar() {
    return this.userService.allUsersMap().get(this.messageData.senderId)?.avatar;
  }

  constructor(private chatService: ChatService, public userService: UserService, private layoutService: LayoutService, private firebaseService: FirebaseService, private dialogService: DialogService, private el: ElementRef) {}

  ngOnInit() {
    this.isThreadMessage = this.type === 'thread';
  }

  ngOnChanges() {
    this.isMe = this.messageData.senderId == this.userService.currentOnlineUser().userUID;
  }

  updateMessage() {
    if (this.isThreadMessage && !this.isTopMessage) {
      this.chatService.updateThreadReply(this.messageData.id, this.messageData.toJson());
    } else if (this.type === 'chat' || this.isTopMessage) {
      this.chatService.updateChatMessage(this.messageData.id, this.messageData.toJson());
    } else if (this.type === 'directMessage') {
      this.chatService.updateDirectMessage(this.messageData.id, this.messageData.toJson());
    }
  }

  openThread() {
    this.layoutService.selectThread(true);
    this.chatService.changeThread(this.messageData);
  }

  didIReact(reaction: Reaction) {
    return reaction.userUIDs.includes(this.userService.currentOnlineUser().userUID);
  }

  removeReaction(reaction: Reaction) {
    const i = reaction.userUIDs.findIndex(el => el === this.userService.currentOnlineUser().userUID);
    if (i !== -1) {
      reaction.userUIDs.splice(i, 1);
      reaction.userNames.splice(i, 1);
      if (reaction.userNames.length === 0) {
        const index = this.messageData.reactions.findIndex(r => r == reaction);
        this.messageData.reactions.splice(index, 1);
      }
    }
  }

  toggleReaction(reaction: Reaction) {
    if (reaction.userNames.includes(this.userService.currentOnlineUser().name)) {
      this.removeReaction(reaction);
    } else {
      reaction.userUIDs.push(this.userService.currentOnlineUser().userUID);
      reaction.userNames.push(this.userService.currentOnlineUser().name);
      this.dialogService.saveLastEmoji(reaction.emoji);
    }
    this.updateMessage();
  }

  addNewReaction(reactionName: string) {
    const index = this.messageData.reactions.findIndex(reaction => reaction.emoji === reactionName);
    if (index === -1) {
      const reaction = new Reaction(reactionName, [this.userService.currentOnlineUser().name], [this.userService.currentOnlineUser().userUID]);
      this.messageData.reactions.push(reaction);
      this.dialogService.saveLastEmoji(reaction.emoji);
      this.updateMessage();
    } else {
      this.toggleReaction(this.messageData.reactions[index]);
    }
    this.areReactionOptionsOpen = false;
  }

  filterReactionUserUIDs(userUIDs: string[]) {
    return userUIDs.filter(el => el !== this.userService.currentOnlineUser().userUID);
  }

  toggleMoreMenu() {
    this.isMoreMenuOpen = !this.isMoreMenuOpen;
    this.areReactionOptionsOpen = false;
  }

  closeMoreMenu() {
    this.isMoreMenuOpen = false;
  }

  toggleReactionOptionMenu() {
    this.areReactionOptionsOpen = !this.areReactionOptionsOpen;
    this.areSecondaryReactionOptionsOpen = false;
    this.isMoreMenuOpen = false;
  }

  toggleSecondaryReactionOptionMenu() {
    this.areSecondaryReactionOptionsOpen = !this.areSecondaryReactionOptionsOpen;
    this.areReactionOptionsOpen = false;
    this.isMoreMenuOpen = false;
  }

  editMessage() {
    this.fileRemoved = false;
    this.closeMoreMenu();
    this.isMessageBeingEdited = true;
    this.editMessageText = this.messageData.content;
  }

  stopEditingMessage() {
    this.isMessageBeingEdited = false;
  }

  saveEditedMessage() {
    const obj = {
      content: this.editMessageText
    };
    if (this.type === 'chat' || (this.layoutService.layoutState().isChatOpen && this.isTopMessage)) {
      this.chatService.updateChatMessage(this.messageData.id, obj);
    } else if (this.type === 'directMessage' || (this.layoutService.layoutState().isDirectMessageOpen && this.isTopMessage)) {
      this.chatService.updateDirectMessage(this.messageData.id, obj);
    } else if (this.type === 'thread') {
      this.chatService.updateThreadReply(this.messageData.id, obj);
    }
    this.stopEditingMessage();
    if (this.fileRemoved) {
      this.chatService.deleteFile(this.messageData.id, this.type);
      this.firebaseService.deleteFile(this.messageData.fileUrl);
    }
  }

  toggleEmojiPickerForEditing() {
    this.dialogService.toggleEmojiPickerForEditingVisibility();
  }

  insertEmoji(emoji: string) {
    this.editMessageText += emoji;
  }

  isSmallMessageWidth() {
    return this.el.nativeElement.offsetWidth < 600;
  }
  isVerySmallMessageWidth() {
    return this.el.nativeElement.offsetWidth < 450;
  }

  handleDeletionEvent() {
    this.fileRemoved = true;
  }

  touchMessage() {
    this.touchMessageTimeout = setTimeout(() => {
      if (!this.isHighlightingMessage) {
        this.messageSelectionEvent.emit('message selected');
      }
      this.isHighlightingMessage = !this.isHighlightingMessage;
    }, this.tapDurationInMilliseconds);
  }

  stopTouchingMessage() {
    clearTimeout(this.touchMessageTimeout);
  }

  onTouchMove() {
    clearTimeout(this.touchMessageTimeout);
  }
}
